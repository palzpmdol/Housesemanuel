var http = require('http'),
    path = require('path'),
    fs = require('fs'),
    querystring = require('querystring'),
    url = require('url');

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

//processFile("table1.json");

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
        //var paramsValues = url.parse(request.url, true).query;
        //console.log(request.url.toString());
        console.log("GET recieved");
        var vertices = [[0,0],[0,5],[5,5],[5,0],[0,0]];
        var X = 6;
        var Y = 2;
        var Inside = checkCoord(vertices, X, Y);
        console.log(Inside);
        response.writeHead(200, 'OK', {'Content-Type': 'text/plain'});
        response.write('' /*+ request.url + '  ' + paramsValues.username*/);
        response.end();

    }
}).listen(8080);
console.log('listening on port 8080...');
