// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
angular.module('starter', ['ionic'])


.run(function ($ionicPlatform) {
    $ionicPlatform.ready(function () {

    /*function httpGet(url) {
        var xmlHttp = new XMLHttpRequest();
        xmlHttp.open("GET", url, false);
        xmlHttp.send();
        return xmlHttp.responseText;
    };
    */

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
.controller('LoginController', function ($scope, $http, $state)
{
    $scope.submit = function (goTo) {
        $state.go('locations');
    };

    $scope.httpGet = function (url) {
        $http.get('http://10.0.0.5:8080').
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
.controller('LocationsController', function ($scope, $http, $state)
{
    $scope.gps = function () {
        navigator.geolocation.getCurrentPosition(function (location) {
            $http.get('http://10.0.0.5:8080?longitude=' + location.coords.longitude + '&latitude=' + location.coords.latitude ).
                success(function (data, status, headers, config) {
                }).
                error(function (data, status, headers, config) {
                });
        })
    }
})
.controller('UserController', function ($scope, $http, $state) {
})
