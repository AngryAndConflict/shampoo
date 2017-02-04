// Here is the starting point for your application code.
// All stuff below is just to show you how it works. You can delete all of it.

// Use new ES6 modules syntax for everything.
import os from 'os'; // native node.js module
import { remote } from 'electron'; // native electron module
import jetpack from 'fs-jetpack'; // module loaded from npm
import { greet } from './hello_world/hello_world'; // code authored by you in this project
import env from './env';
import xelib from './xeditLib.js';

console.log('Loaded environment variables:', env);

var app = remote.app;
var appDir = jetpack.cwd(app.getAppPath());

// Holy crap! This is browser window with HTML and stuff, but I can read
// here files like it is node.js! Welcome to Electron world :)
console.log('The author of this app is:', appDir.read('package.json', 'json').author);

// helper function for loading json file
var loadJsonFile = function(filename, defaultValue) {
  if (appDir.exists(filename) === 'file') {
    return appDir.read(filename, 'json');
  } else {
    return defaultValue || [];
  }
};

var ngapp = angular.module('shampoo', [
  'ui.router', 'ct.ui.router.extras'
]);

ngapp.config(function($urlMatcherFactoryProvider) {
    //this allows urls with and without trailing slashes to go to the same state
    $urlMatcherFactoryProvider.strictMode(false);
});

ngapp.run(['$rootScope', '$state', function($rootScope, $state) {
    $rootScope.$on('$stateChangeStart', function(evt, toState, params, fromState) {
        if (toState.redirectTo) {
            evt.preventDefault();
            $state.go(toState.redirectTo, params, { location: 'replace' });
        }
    });
}]);

// TODO: GET PROPER BUNDLING INSTEAD
ngapp.config(['$stateProvider', function($stateProvider) {
  $stateProvider.state('base', {
    url: '',
    redirectTo: 'base.start',
    templateUrl: 'partials/base.html',
    controller: 'baseController'
  });
}]);

ngapp.service('profileService', function() {
  var service = this;

  this.games = loadJsonFile('app/games.json');
  this.profiles = loadJsonFile('app/profiles.json');

  this.saveProfiles = function(profiles) {
    appDir.write('app/profiles.json', JSON.stringify(profiles));
  };

  this.createProfile = function(game) {
    var installPath = xelib.GetGamePath(game.mode);
    if (installPath) {
      return {
        name: game.name,
        gameMode: game.mode,
        installPath: installPath
      }
    }
  };

  this.detectMissingProfiles = function(profiles) {
    service.games.forEach(function(game) {
      var gameProfile = profiles.find(function(profile) {
        return profile.gameMode == game.mode;
      });
      if (!gameProfile) {
        gameProfile = service.createProfile(game);
        if (gameProfile) profiles.push(gameProfile);
      }
    });
  };

  this.getProfiles = function() {
    service.detectMissingProfiles(service.profiles);
    service.saveProfiles(service.profiles);
    return service.profiles;
  };

  this.getGame = function(gameMode) {
    return service.games.find(function(game) {
      return game.mode == gameMode;
    });
  };
});

ngapp.controller('baseController', function($scope, $rootScope) {
  // initialize xedit-lib
  xelib.Initialize();

  $scope.helpMode = false;

  $scope.helpClick = function() {
    console.log("Help clicked");
  };

  $scope.minimizeClick = function() {
    console.log("Minimize clicked");
  };

  $scope.restoreClick = function() {
    console.log("Restore clicked");
  };

  $scope.closeClick = function() {
    console.log("Close clicked");
  };
});

ngapp.config(['$stateProvider', function($stateProvider) {
    $stateProvider.state('base.start', {
        templateUrl: 'partials/start.html',
        controller: 'startController',
        url: '/start'
    });
}]);

ngapp.controller('startController', function($scope, profileService) {
  // $scope.oblivionPath = xelib.GetGamePath(2);
  // $scope.skyrimPath = xelib.GetGamePath(3);
  // $scope.skyrimsePath = xelib.GetGamePath(4);
  // $scope.fallout4Path = xelib.GetGamePath(5);
  //console.log(xelib.GetBuffer());

  $scope.profiles = profileService.getProfiles();
  $scope.selectedProfile =  ($scope.profiles.length > 0) && $scope.profiles[0];

  $scope.setSelectedGame = function() {
    if ($scope.selectedProfile) {
      $scope.selectedGame = profileService.getGame($scope.selectedProfile.gameMode);
    } else {
      $scope.selectedGame = {};
    }
  };

  // load selectedGame
  $scope.setSelectedGame();
});
