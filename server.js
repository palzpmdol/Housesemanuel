var http = require('http'),
    path = require('path'),
    fs = require('fs'),
    querystring = require('querystring'),
    url = require('url'),
    async = require('async'),
    request = require('request'),
    mysql = require('mysql');

var pool = mysql.createPool({
  connectionLimit: 10,
  host: 'localhost',
  user: 'lawrence',
  password: 'lawrence11',
  database: 'houses'
});

function processFile(file) {
  fs.readFile(file, 'utf8', function(err, contents){
    if (!err) {
      console.log(JSON.parse(contents).cheeks);
    }
    else {
      console.log(err);
      return null;
    }
  });
}

var authenticate = function(token) {
  request('https://www.googleapis.com/oauth2/v1/tokeninfo?id_token=' + token, function (error, response, body) {
    if (!error && response.statusCode == 200) {
        return body
    }
});
};

var checkCoord = function(vertices, X, Y) {
    var Inside = false;
    var j = vertices.length-1;
    for(i=0; i<vertices.length; i++) {
        if(vertices[i][1] >= Y && Y > vertices[j][1]
           || vertices[i][1] < Y && Y <= vertices[j][1]) {
            if(vertices[i][0]+(Y-vertices[i][1])/(vertices[j][1]-vertices[i][1])*(vertices[j][0]-vertices[i][0]) < X) {
                Inside = !Inside;
            }
        }
        j=i;
    }
    return Inside;
}

var updateLocation = function(user, X, Y) {
    var vertices = [];
    pool.query("SELECT * FROM vertices ORDER BY idBuilding, idVertice", function (err, results, field) {
      for (var building = 0; building < results.length; building++) {
        if (results[building].idBuilding > vertices.length) {
          vertices.push([]);
        };
        vertices[results[building].idBuilding - 1].push([results[building].X, results[building].Y]);
      };
      for (var building = 0; building < vertices.length; building++) {
        if (checkCoord(vertices[building], X, Y)) {
          pool.query("UPDATE users SET LocationX = " + X + ", LocationY = " + Y + ", Building = " + building + 1 + " WHERE User = " + user);
          break;
        };
      };
    });
}

var signOut = function(user) {
    pool.query("UPDATE users SET LocationX = null, LocationY = null, Building = null WHERE User = " + user);
}

function processPost(request, response, callback) {
    var queryData = "";
    if(typeof callback !== 'function') return null;

    if(request.method == 'POST') {
        request.on('data', function(data) {
            queryData += data;
            if(queryData.length > 1e6) {
                queryData = "";
                response.writeHead(413, {'Content-Type': 'text/plain'}).end();
                request.connection.destroy();
            }
        });

        request.on('end', function() {
            request.post = JSON.parse(queryData);
            //request.post = querystring.parse(queryData);

            if (request.url.toLower() === '/setLocation' ) {
                updateLocation(request.post.User, request.post.X, request.post.Y);
                callback();
            } else if (request.url.toLower() === '/signIn' ) {
                callback();
            } else if (request.url.toLower() === '/signOut' ) {
                signOut(request.post.User);
                callback();
            } else {
                response.writeHead(404, {'Content-Type': 'text/plain'}).end();
                request.connection.destroy();
            }
        });

    } else {
        response.writeHead(405, {'Content-Type': 'text/plain'});
        response.end();
    }
}

function getBuildingsWithFaction(callback) {
  pool.query("SELECT building.*, faction.colour FROM building left join faction on building.controllingFaction = faction.idFaction order by idBuilding", function(err, results, field){
    var buildings = [];
    if (err) {
      console.log(err);
    } else {
      for (var row = 0; row < results.length; row++) {
        buildings[row] = {
          "ControllingFaction":results[row].ControllingFaction,
          "idBuilding":results[row].idBuilding,
          "colour":results[row].colour
        };
      }
    }
    callback(err, buildings);
  });
}

function getBuildingVertices(callback) {
  pool.query("SELECT * FROM vertices order by idBuilding, idVertice", function(err, results, field){
    var vertices = [];
    if (err) {
      console.log(err);
    } else {
      for (var row = 0; row < results.length; row++) {
        vertices[row] = {
          "idVertice":results[row].idVertice,
          "idBuilding":results[row].idBuilding,
          "X":results[row].X,
          "Y":results[row].Y
        };
      }
    }
    callback(err, vertices);
  });
}

http.createServer(function(request, response) {
    if (request.method == 'POST') {
        processPost(request, response, function() {
            response.writeHead(200, "OK", {'Content-Type': 'text/plain'});
            response.write('' + querystring.stringify(request.post));
            response.end();
        });
    }

    if (request.method == 'GET') {
        var paramsValues = url.parse(request.url, true).query.request;
        response.writeHead(200, 'OK', {'Content-Type': 'text/plain'});

        if (paramsValues == 'data') {
          async.parallel({
            building: getBuildingsWithFaction,
            buildingVertices: getBuildingVertices
          },
          function(err, results){
            var buildingLocation = [];
            for (var row = 0; row < results.building.length; row++) {
              var building = {"colour":results.building[row].colour, "vertice":[]};
              for (var i = 0; i < results.buildingVertices.length; i++) {
                if (results.buildingVertices[i].idBuilding == results.building[row].idBuilding) {
                  building.vertice.push([results.buildingVertices[i].X, results.buildingVertices[i].Y]);
                };
              };
              buildingLocation.push(building);
            };
            response.write('' + JSON.stringify(buildingLocation));
            response.end();
          });
        };
      }
}).listen(8080);
console.log('listening on port 8080...');



// Background process to recalculate points and building ownership
var checkPoints = function() {
    async.series([
        UpdateFactionPoints,
        UpdateControllingFactions
    ]);

    function UpdateFactionPoints(callback) {
        pool.query("SELECT idUser, Faction, Building FROM users ORDER BY idUser", function (err, results, field) {
            async.eachSeries(results, function(result, callbackIn) {
                    async.parallel([
                          function(callbackP) { pool.query("UPDATE factionbuilding SET Points = Points + 10 WHERE idBuilding = " + result.Building
                            + " AND idFaction = " + result.Faction, callbackP) },
                          function(callbackP) { pool.query("UPDATE factionbuilding SET Points = Points - 3 WHERE idBuilding = " + result.Building
                            + " AND idFaction != " + result.Faction + " AND Points != 0", callbackP) }
                        ], function(err) {
                          if (err) { console.log(err); }
                          callbackIn();
                        }
                    );  //end of parallel
                }, function(err) {
                    if (err) { console.log(err); }
                    callback(err);
                }
            );
        });
    }

    function UpdateControllingFactions(callback) {
        pool.query("SELECT idBuilding, max(Points) as maxPoints FROM factionbuilding group by idBuilding", function (err, results, field) {
            async.eachSeries(results,
                  function(result, callbackIn) {
                      pool.query("SELECT idBuilding, idFaction FROM factionbuilding where idBuilding=" + result.idBuilding + " and Points = " + result.maxPoints,
                          function (err, results1, field1) {
                             if (err) { console.log(err); }
                             else {
                               if (results1.length === 1) {
                                 pool.query("Update building set ControllingFaction = " + results1[0].idFaction + " where idBuilding = " + results1[0].idBuilding, callbackIn);
                               } else {
                                 pool.query("Update building set ControllingFaction = NULL where idBuilding = " + results1[0].idBuilding, callbackIn);
                               }
                             }
                          });
                  },
                  function(err) {
                    if (err) { console.log(err); }
                  }
            );
            callback(err);
        });
    }
};

setInterval(checkPoints, 5000);
