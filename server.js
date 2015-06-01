var http = require('http'),
    path = require('path'),
    fs = require('fs'),
    querystring = require('querystring'),
    url = require('url'),
    async = require('async'),
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
            console.log('raw data: ' + queryData.toString());
            request.post = querystring.parse(queryData);
            console.log('parsed data: ' + request.post.username)
            callback();
        });

    } else {
        response.writeHead(405, {'Content-Type': 'text/plain'});
        response.end();
    }
}

function getFactions(callback) {
  pool.query("SELECT * FROM faction", function(err, results, fields){
    var factions = [];
    if (err) {
      console.log(err);
    } else {
      for (var row = 0; row < results.length; row++) {
        factions[row] = {
          "Colour":results[row].Colour,
          "Name":results[row].Name,
          "idFaction": results[row].idFaction
          };
      }
    }
    callback(err, factions);
  });
}

function getBuildings(callback) {
  pool.query("SELECT * FROM building order by idBuilding", function(err, results, field){
    var buildings = [];
    if (err) {
      console.log(err);
    } else {
      for (var row = 0; row < results.length; row++) {
        buildings[row] = {
          "ControllingFaction":results[row].ControllingFaction,
          "idBuilding":results[row].idBuilding
        };
      }
    }
    callback(err, buildings);
  });
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
            //console.log(request.post.toString());

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
            //faction: getFactions,
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
