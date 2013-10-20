'use strict';

function s4() {
  return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
}

function guid() {
  return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
}

angular.module('firePokerApp')
  .controller('MainCtrl', function ($rootScope, $scope, $cookieStore, $location, $routeParams, angularFire) {

    // Firebase URL
    var URL = 'https://pzfqrq7kjy.firebaseio.com';

    // Load cookies
    $scope.fp = $cookieStore.get('fp');
    if (!$scope.fp) {
      $scope.fp = {};
    }

    // UID
    if (!$scope.fp.user || !$scope.fp.user.id) {
      var uid = guid();
      $scope.fp.user = {id: uid};
      $cookieStore.put('fp', $scope.fp);
    }

    // GID
    if (!$scope.fp.gid) {
      var gid = guid();
      $scope.fp.gid = gid;
      $cookieStore.put('fp', $scope.fp);
    }

    // Initialize Firebase
    var ref = new Firebase(URL);

    // Generate a new game
    if ($location.path() === '/games/new' || $location.path() === '/games/new/') {
      var id = guid();
      $location.path('/games/new/' + id);
    }

    // Redirect to set full name if empty...
    if (
      $routeParams.gid &&
      $location.path() === '/games/' + $routeParams.gid &&
      !$scope.fp.user.fullname
    ) {
      $location.path('/games/join/' + $routeParams.gid);
    }

    // If fullname already set redirect to the game
    if (
      $routeParams.gid &&
      $location.path() === '/games/join/' + $routeParams.gid &&
      $scope.fp.user.fullname
    ) {
      $location.path('/games/' + $routeParams.gid);
    }

    // Load game & register presence
    if ($routeParams.gid && $location.path() === '/games/' + $routeParams.gid) {
      angularFire(ref.child('/games/' + $routeParams.gid), $scope, 'game').then(function() {
        // Is current user the game owner?
        if ($scope.game.owner && $scope.game.owner.id && $scope.game.owner.id === $scope.fp.user.id) {
          $scope.isOwner = true;
        } else {
          $scope.isOwner = false;
        }
      });
      ref.child('/games/' + $routeParams.gid + '/participants/' + $scope.fp.user.id).set($scope.fp.user);
      var onlineRef = ref.child('/games/' + $routeParams.gid + '/participants/' + $scope.fp.user.id + '/online');
      var connectedRef = ref.child('/.info/connected');
      connectedRef.on('value', function(snap) {
        if (snap.val() === true) {
          // We're connected (or reconnected)!  Set up our presence state and
          // tell the server to set a timestamp when we leave.
          onlineRef.onDisconnect().set(Firebase.ServerValue.TIMESTAMP);
          onlineRef.set(true);
        }
      });
    }

    // Create game
    $scope.createGame = function() {
      var stories = [],
          newGame = angular.copy($scope.newGame);
      if (newGame.stories) {
        angular.forEach(newGame.stories.split('\n'), function(title) {
          var story = {
            title: title,
            status: 'queue'
          };
          stories.push(story);
        });
      }
      newGame.stories = stories;
      newGame.status = 'active';
      newGame.created = new Date().getTime();
      newGame.owner = $scope.fp.user;
      newGame.participants = false;
      newGame.estimate = false;
      ref.child('/games/' + $routeParams.gid).set(newGame);
      $cookieStore.put('fp', $scope.fp);
      $location.path('/games/' + $routeParams.gid);
    };

    // Create story
    $scope.createStory = function(type) {
      if (type === 'structured') {
        var title = 'As a/an ' +
          $scope.newStory.asA +
          ' I would like to ' +
          $scope.newStory.iWouldLikeTo +
          ' so that ' +
          $scope.newStory.soThat;
        $scope.newStory.title = title;
        delete $scope.newStory.asA;
        delete $scope.newStory.iWouldLikeTo;
        delete $scope.newStory.soThat;
      }
      $scope.newStory.results = false;
      $scope.newStory.points = 0;
      $scope.newStory.status = 'queue';
      $scope.newStory.startedAt = false;
      $scope.newStory.endedAt = false;
      if (!$scope.game.stories) {
        $scope.game.stories = [];
      }
      $scope.game.stories.push($scope.newStory);
      $scope.newStory = null;
      // Set this story if there is none active
      // maybe this is good thing todo only if the queue is empty
      if (!$scope.game.estimate) {
        $scope.setStory($scope.game.stories.length - 1);
      }
    };

    // Set story
    $scope.setStory = function(index) {
      $scope.resetRound();
      $scope.game.estimate = $scope.game.stories[index];
      $scope.game.estimate.status = 'active';
      $scope.game.estimate.id = index;
      $scope.game.estimate.startedAt = new Date().getTime();
      $scope.game.estimate.endedAt = false;
    };

    // Delete story
    $scope.deleteStory = function(index) {
      $scope.game.stories.splice(index, 1);
    };

    // Estimate story
    $scope.estimate = function(points) {
      if (!$scope.game.estimate.results) {
        $scope.game.estimate.results = [];
      }
      $scope.game.estimate.results.push({points:points, user:$scope.fp.user});
    };

    // Set full name
    $scope.setFullname = function() {
      $cookieStore.put('fp', $scope.fp);
      $location.path('/games/' + $routeParams.gid);
    };

    // Get estimate results average
    $scope.getResultsAverage = function() {
      var avg = 0;
      if ($scope.game.estimate.results) {
        var sum = 0;
        angular.forEach($scope.game.estimate.results, function(result) {
          if (result.points && angular.isNumber(result.points)) {
            sum += +result.points;
          }
        });
        avg = Math.ceil(sum / $scope.game.estimate.results.length);
      }
      return avg;
    };

    // Get total of active participants
    $scope.totalOfOnlineParticipants = function() {
      var totalOfOnlineParticipants = 0;
      if ($scope.game && $scope.game.participants) {
        angular.forEach($scope.game.participants, function(participant) {
          if (participant.online === true) {
            totalOfOnlineParticipants++;
          }
        });
      }
      return totalOfOnlineParticipants;
    };

    // Accept
    $scope.acceptRound = function() {
      $scope.game.estimate.points = $scope.newEstimate.points;
      $scope.game.estimate.endedAt = new Date().getTime();
      $scope.game.estimate.status = 'closed';
      $scope.game.stories[$scope.game.estimate.id] = angular.copy($scope.game.estimate);
      $scope.game.estimate = false;
    };

    // Play again
    $scope.playAgain = function() {
      $scope.game.estimate.results = [];
      $scope.game.estimate.status = 'active';
    };

    // Reset round
    $scope.resetRound = function() {
      if ($scope.game.estimate) {
        var idx = $scope.game.estimate.id;
        $scope.game.stories[idx].startedAt = false;
        $scope.game.stories[idx].endedAt = false;
        $scope.game.stories[idx].status = 'queue';
        $scope.game.estimate = false;
      }
    };

    // Reveal cards
    $scope.revealCards = function() {
      $scope.game.estimate.status = 'reveal';
    };

    // Card deck options
    $scope.decks = [
      [0, 1, 2, 4, 8, 16, 32, 64, 128, '?'],
      [0, 0.5, 1, 2, 3, 5, 8, 13, 20, 40, 100, '?']
    ];

    // Default card deck
    $scope.newGame = {deck: 0};

    // Update game
    $scope.$watch('game', function(game) {
      // Defaults
      $scope.showCardDeck = true;
      $scope.showSelectEstimate = false;
      $scope.showAddStory = false;
      $scope.disablePlayAgainAndRevealButtons = false;
      $scope.showCards = false;
      if (!game) {
        return;
      }
      // Set card deck visibility
      if (game.estimate && game.estimate.results) {
        angular.forEach(game.estimate.results, function(result) {
          if (
            result &&
            result.user &&
            result.user.id &&
            result.user.id === $scope.fp.user.id
          ) {
            $scope.showCardDeck = false;
          }
        });
      }
      // Set estimation form visibility
      if (
        game.estimate &&
        // game.estimate.results &&
        game.owner &&
        game.owner.id === $scope.fp.user.id
      ) {
        $scope.showSelectEstimate = true;
      }
      // Set new estimate average points
      $scope.newEstimate = { points: $scope.getResultsAverage() };
      // Set add story form visibility
      if (game.owner && game.owner.id === $scope.fp.user.id) {
        $scope.showAddStory = true;
      }
      // Disable play again and reveal buttons if results are empty
      if (!game.estimate.results || game.estimate.results.length === 0) {
        $scope.disablePlayAgainAndRevealButtons = true;
      }
      // Show cards? 
      if ($scope.game.estimate.status == 'reveal') {
        $scope.showCards = true;
      } else if (
        game.estimate &&
        game.estimate.results &&
        game.estimate.results.length &&
        game.estimate.results.length >= $scope.totalOfOnlineParticipants()
      ) {
        $scope.showCards = true;
      }
    });
  });

