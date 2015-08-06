// Copyright © Mapotempo, 2014-2015
//
// This file is part of Mapotempo.
//
// Mapotempo is free software. You can redistribute it and/or
// modify since you respect the terms of the GNU Affero General
// Public License as published by the Free Software Foundation,
// either version 3 of the License, or (at your option) any later version.
//
// Mapotempo is distributed in the hope that it will be useful, but WITHOUT
// ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
// or FITNESS FOR A PARTICULAR PURPOSE.  See the Licenses for more details.
//
// You should have received a copy of the GNU Affero General Public License
// along with Mapotempo. If not, see:
// <http://www.gnu.org/licenses/agpl.html>
//
var http = require('http');
var url = require('url');
var querystring = require('querystring');
var isochrone = require('osrm-isochrone');
var argv = require('minimist')(process.argv.slice(2));

if (!('osrm' in argv)) {
  console.log('Usage --osrm file.osrm [--port 1723]');
  process.exit();
}
var osrm = argv['osrm']; // prebuild dc osrm network file

var port = 1723;
if ('port' in argv) {
  port = parseInt(argv['port']);
}

var server = http.createServer(function(req, res) {
  var page = url.parse(req.url).pathname;
  var params = querystring.parse(url.parse(req.url).query);
  console.log(page, params);

  if (page == '/0.1/isochrone') {
    var resolution = 25; // sample resolution
    var time = 300; // 300 second drivetime (5 minutes)
    var location = [-77.02926635742188,38.90011780426885]; // center point

    if ('resolution' in params) {
      resolution = parseInt(params['resolution']);
    }
    if ('time' in params) {
      time = parseInt(params['time']);
    }
    if ('lat' in params) {
      location[1] = parseFloat(params['lat']);
    }
    if ('lng' in params) {
      location[0] = parseFloat(params['lng']);
    }

    isochrone(location, time, resolution, osrm, function(err, drivetime) {
      if(err) throw err;
      if (drivetime.features.length > 0) {
        drivetime.features.map(function(feature) {
          feature.geometry.type = 'Polygon';
          feature.geometry.coordinates = [feature.geometry.coordinates];
        });
      }
      res.writeHead(200, {'Content-Type': 'application/json'});
      res.write(JSON.stringify(drivetime));
      console.log('200 Done');
      res.end();
    });
  } else {
    console.log(404);
    res.writeHead(404);
    res.end();
  }
});

server.listen(port);
console.log('Listen on port ' + port);
