// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
angular.module('starter', ['ionic'])


.run(function ($ionicPlatform) {
    $ionicPlatform.ready(function () {
    // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
    // for form inputs)
    if(window.cordova && window.cordova.plugins.Keyboard) {
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
    }
    if(window.StatusBar) {
      StatusBar.styleDefault();
    }
  });
})
.config(function ($stateProvider, $urlRouterProvider) {
    $stateProvider
        .state('login', {
            url: '/login',
            templateUrl: 'templates/login.html',
            controller: 'LoginController'
        })
        .state('err', {
            url: '/err',
            templateUrl: 'templates/err.html',
            controller: 'ErrController'
        })
        .state('locations', {
            url: '/locations',
            templateUrl: 'templates/locations.html',
            controller: 'LocationsController'
        })
        .state('user', {
            url: "/users/:userId",
            templateUrl: "templates/user.html",
            controller: "UserController"
        });
    $urlRouterProvider.otherwise('/login');
})
.factory('GetServerData', function($http)
{
    return {
        locations: function () {
            return [
                { "colour": "#FF00FF", "vertice": [] },
                {
                    "colour": "#FF0000", "vertice": [
                      [-33.906755, 151.243568],
                      [-33.906798, 151.24397],
                      [-33.90693, 151.243948],
                      [-33.90692, 151.243835],
                      [-33.906977, 151.243827],
                      [-33.906966, 151.243718],
                      [-33.906909, 151.243726],
                      [-33.906888, 151.243546]]
                },
                { "colour": "#FF00FF", "vertice": [] },
                { "colour": "#0000FF", "vertice": [] }
            ];

            /*
            $http.get('http://10.0.0.5:8080?request=data').
                success(function (data, status, headers, config) {
                    return data;
                }).
                error(function (data, status, headers, config) {
                    console.log('err');
                    return {};
                });
            */
        },
        currentLocation: function (X, Y) {
            return { X: X, Y: Y };
        }
    }
})
.controller('LoginController', function ($scope, $http, $state, GetServerData)
{
    $scope.submit = function (goTo) {
        $state.go('locations');
    };

    $scope.httpGet = function (url) {
        $http.get('http://127.0.0.1:8080').
            success(function (data, status, headers, config) {
                console.log('locations');
                $state.go('locations');
                // $state.transitionTo('/locations');
            }).
            error(function (data, status, headers, config) {
                console.log('err');
                $state.go('err');
               //  $state.transitionTo('/err');
            });
    }
})
.controller('ErrController', function ($scope, $http, $state)
{
})
.controller('LocationsController', function ($scope, $http, $interval, $state, GetServerData)
{
    mapShapes = [];

    $scope.gps = function () {
        navigator.geolocation.getCurrentPosition(function (location) {
            $http.get('http://10.0.0.5:8080?longitude=' + location.coords.longitude + '&latitude=' + location.coords.latitude).
                success(function (data, status, headers, config) {
                }).
                error(function (data, status, headers, config) {
                    console.log('err');
                });
        })
    };

    $scope.getData = function () {
        var data = GetServerData.locations;
        //$http.get('http://10.0.0.5:8080?request=data').
        //    success(function (data, status, headers, config) {
        if (data != {}) {
            for (var shape = 0; shape < mapShapes.length; shape++) {
                mapShapes[shape].setMap(null);
            };
            for (var building = 0; building < data.length; building++) {
                var coords = []
                for (var coord = 0; coord < data[building].vertice.length; coord++) {
                    coords.push(new google.maps.LatLng(data[building].vertice[coord][0], new google.maps.LatLng(data[building].vertice[coord][1])));
                };
                var shape = new google.maps.Polygon({
                    paths: coords,
                    strokeColor: data[building].colour,
                    strokeOpacity: 0.8,
                    strokeWeight: 1,
                    fillColor: data[building].colour,
                    fillOpacity: 0.8
                });
                shape.setMap($scope.map);
                mapShapes.push(shape);
            };
        }
         //   }).
         //   error(function (data, status, headers, config) {
         //       console.log('err');
         //   });
    };

    $interval($scope.getData(), 30000);
})
.controller('UserController', function ($scope, $http, $state) {
})
.controller('MapController', function ($scope, $ionicLoading) {

    $scope.initGoogle = function () {
        var myLatlng = new google.maps.LatLng(-33.9067, 151.2436);

        styles = [
          {
              "elementType": "labels.text",
              "stylers": [
                { "visibility": "off" }
              ]
          }, {
              "elementType": "labels.icon",
              "stylers": [
                { "visibility": "off" }
              ]
          }
        ];

        var mapOptions = {
            center: myLatlng,
            zoom: 18,
            mapTypeControlOptions: {
                mapTypeIds: [google.maps.MapTypeId.ROADMAP, 'map_style']
            }
        };

        var map = new google.maps.Map(document.getElementById('map'), mapOptions);

        var styledMap = new google.maps.StyledMapType(styles, { name: "Styled" });
        map.mapTypes.set('map_style', styledMap);
        map.setMapTypeId('map_style');

        var userMarker = new google.maps.Marker({ position: myLatlng, map:map});

        $scope.map = map;
    };
})
