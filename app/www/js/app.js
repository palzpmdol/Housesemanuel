// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
angular.module('starter', ['ionic', 'ngCordova'])


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
    $urlRouterProvider.otherwise('/login');
})
.factory('GetServerData', function($http)
{
    return {
        locations: function () {
            return [
                {
                    "colour": "#FF00FF", "vertice": [
                    [-33.906209, 151.243441],
                    [-33.906245, 151.243699],
                    [-33.906589, 151.243627],
                    [-33.906551, 151.243369]]
                },
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
.controller('LoginController', function ($scope, $http, $state, GetServerData, $rootScope, $cordovaOauth)
{
    $scope.googleLogin = function () {
        $cordovaOauth.google('873032904860-64qmbbo08smgekt773m59ahfiilus2tf.apps.googleusercontent.com', ['https://www.googleapis.com/auth/urlshortener', 'https://www.googleapis.com/auth/userinfo.email']).then(function (result) {
            alert(JSON.stringify(result));
        }, function (error) { });
    };
/*
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
    }; */
})
.controller('ErrController', function ($scope, $http, $state)
{
})
.controller('LocationsController', function ($scope, $http, $interval, $state, GetServerData, $rootScope)
{
    var mapShapes = [];
    var userMarker;

    $scope.gps = function () {
        navigator.geolocation.getCurrentPosition(function (location) {
            $http.post('http://10.0.0.5:8080', {'User':$rootScope.profile.getEmail(), 'X':location.coords.longitude, 'Y':location.coords.latitude}).
                success(function (data, status, headers, config) {
                    userMarker.setMap(null);
                    userMarker = new google.maps.Marker({ position: new google.maps.LatLng(-33.9067, 151.2436), map: map });
                }).
                error(function (data, status, headers, config) {
                    console.log('err');
                });
        })
    };

    $scope.getData = function () {
        var data = GetServerData.locations();
        //$http.get('http://10.0.0.5:8080?request=data').
        //    success(function (data, status, headers, config) {
        if (data != {}) {
            for (var shape = 0; shape < mapShapes.length; shape++) {
                mapShapes[shape].setMap(null);
            };
            mapShapes = []
            for (var building = 0; building < data.length; building++) {
                var coords = []
                for (var coord = 0; coord < data[building].vertice.length; coord++) {
                    coords.push(new google.maps.LatLng(data[building].vertice[coord][0], data[building].vertice[coord][1]));
                };
                var shape = new google.maps.Polygon({
                    paths: coords,
                    strokeColor: data[building].colour,
                    strokeOpacity: 0.8,
                    strokeWeight: 1,
                    fillColor: data[building].colour,
                    fillOpacity: 0.8
                });
                shape.setMap($rootScope.map);
                mapShapes.push(shape);
            };
        }
         //   }).
         //   error(function (data, status, headers, config) {
         //       console.log('err');
         //   });
    };

    $interval(function () { $scope.getData();}, 30000);
})
.controller('MapController', function ($scope, $ionicLoading, $rootScope) {

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

        $rootScope.map = map;
    };
})
