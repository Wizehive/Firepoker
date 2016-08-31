'use strict';

angular.module('firePokerApp', ['firebase', 'ngCookies'])
  .config(function ($routeProvider, $httpProvider) {
    delete $httpProvider.defaults.headers.common['X-Requested-With'];

    $routeProvider
      .when('/', {
        templateUrl: 'views/games/index.html',
        controller: 'MainCtrl'
      })
      .when('/games/new/:gid', {
        templateUrl: 'views/games/new.html',
        controller: 'MainCtrl'
      })
      .when('/games/:gid', {
        templateUrl: 'views/games/view.html',
        controller: 'MainCtrl'
      })
      .when('/games/join/:gid', {
        templateUrl: 'views/games/join.html',
        controller: 'MainCtrl'
      })
      .otherwise({
        redirectTo: '/'
      });
  });

