'use strict';

/**
 * MainCtrl
 *
 * @fileoverview FirePoker.io is a monolithic well tested app, so for now all it's
 *  logic is on this single controller, in the future we could be splitting the logic
 *  into diff files and modules.
 * @version 0.3.0
 * @author Everton Yoshitani <everton@wizehive.com>
 * @todo add remain unit tests and perfect after learn' more about testing
 */
angular.module('firePokerApp')
  .controller('MainCtrl', function ($rootScope, $scope, $cookieStore, $location, $routeParams, $timeout, angularFire) {

    // Firebase URL
    var URL = 'https://pzfqrq7kjy.firebaseio.com';

    // Initialize Firebase
    /*global Firebase*/
    var ref = new Firebase(URL);

    // UUID generator
    // Snippet from: http://stackoverflow.com/questions/105034/how-to-create-a-guid-uuid-in-javascript
    var s4 = function() {
      return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
    };

    var guid = function() {
      return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
    };

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

    // Is landing page?
    $rootScope.isLandingPage = function() {
      return $location.path() !== '/';
    };

    // Redirect with a GID to create new games
    $scope.redirectToCreateNewGame = function() {
      if ($location.path() === '/games/new' || $location.path() === '/games/new/') {
        $scope.fp.gid = guid();
        $location.path('/games/new/' + $scope.fp.gid);
        $location.replace();
      }
    };

    // Redirect to set fullname if empty
    $scope.redirectToSetFullnameIfEmpty = function() {
      if (
        $routeParams.gid &&
        $location.path() === '/games/' + $routeParams.gid &&
        !$scope.fp.user.fullname
      ) {
        $location.path('/games/join/' + $routeParams.gid);
        $location.replace();
      }
    };

    // Redirect to game if fullname already set
    $scope.redirectToGameIfFullnameAlreadySet = function() {
      if (
        $routeParams.gid &&
        $location.path() === '/games/join/' + $routeParams.gid &&
        $scope.fp.user.fullname
      ) {
        $location.path('/games/' + $routeParams.gid).replace();
      }
    };

    // Load game and register presence
    $scope.loadGame = function() {
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
    };

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
      $scope.setNewGame(newGame);
      $cookieStore.put('fp', $scope.fp);
      $location.path('/games/' + $routeParams.gid);
      $location.replace();
    };

    // Set new game
    $scope.setNewGame = function(game) {
      ref.child('/games/' + $routeParams.gid).set(game);
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
      $scope.showCardDeck = true;
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
      $scope.showCardDeck = true;
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
      $location.replace();
    };

    // Get estimate results average
    $scope.getResultsAverage = function() {
      var avg = 0;
      if ($scope.game.estimate.results) {
        var sum = 0;
        angular.forEach($scope.game.estimate.results, function(result) {
          if (result.points && angular.isNumber(result.points)) {
            sum += result.points;
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

    // Set Defaults
    $scope.newGame = {deck: 0};
    $scope.showCardDeck = true;
    $scope.showSelectEstimate = false;
    $scope.disablePlayAgainAndRevealButtons = false;
    $scope.showCards = false;

    // Set card deck visibility
    $scope.setShowCardDeck = function() {
      if ($scope.game.estimate && $scope.game.estimate.results) {
        angular.forEach($scope.game.estimate.results, function(result) {
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
    };

    // Set estimation form visibility
    $scope.setShowSelectEstimate = function() {
      if (
        $scope.game.estimate &&
        $scope.game.owner &&
        $scope.game.owner.id === $scope.fp.user.id
      ) {
        $scope.showSelectEstimate = true;
      }
    };

    // Set new estimate average points
    $scope.setNewEstimate = function() {
      $scope.newEstimate = { points: $scope.getResultsAverage() };
    };

    // Disable play again and reveal buttons if results are empty
    $scope.setDisablePlayAgainAndRevealButtons = function() {
      if (!$scope.game.estimate.results || $scope.game.estimate.results.length === 0) {
        $scope.disablePlayAgainAndRevealButtons = true;
      }
    };

    // Show cards?
    $scope.setShowCards = function() {
      if ($scope.game.estimate.status === 'reveal') {
        $scope.showCards = true;
      } else if (
        $scope.game.estimate &&
        $scope.game.estimate.results &&
        $scope.game.estimate.results.length &&
        $scope.game.estimate.results.length >= $scope.totalOfOnlineParticipants()
      ) {
        $scope.showCards = true;
      }
    };

    // Wait 1 sec before show social buttons
    $timeout(function() {
      $scope.showSocialButtons = true;
    }, 1000);

    // Redirect with a GID to create new games
    $scope.redirectToCreateNewGame();

    // Redirect to set fullname if empty
    $scope.redirectToSetFullnameIfEmpty();

    // Redirect to game if fullname already set
    $scope.redirectToGameIfFullnameAlreadySet();

    // Load game and register presence
    $scope.loadGame();

    // Update view on game changes
    $scope.$watch('game', function(game) {
      if (!game) {
        return;
      }
      $scope.setShowCardDeck();
      $scope.setShowSelectEstimate();
      $scope.setNewEstimate();
      $scope.setDisablePlayAgainAndRevealButtons();
      $scope.setShowCards();
    });

    /* BEGIN Timer -------------- */
    var timerRef = ref.child('/games/' + $routeParams.gid + '/timer');
    timerRef.on('value', function(snap) {
      var timerData = snap.val();
      if (timerData !== null) {
        $scope.timerCounter = timerData.timerCounter;
        $scope.updateTimerDisplay();
        $scope.timerMessage = timerData.timerMessage;
        $scope.isTimerRunning = timerData.isTimerRunning;
        $scope.isTimerAtBeginning = timerData.isTimerAtBeginning;
        var owner = timerData.owner;
        $scope.timerControlsEnabled = owner === null || owner.id === $scope.fp.user.id;
        $scope.timerOwnerName = owner === null ? '' : owner.fullname;
      }
    });

    var timerHandle;
    var DEFAULT_COUNTER = 120;
    $scope.timerControlsEnabled = true;
    $scope.isTimerRunning = false;
    $scope.timerCounter = DEFAULT_COUNTER;
    $scope.timerDisplay = '2:00';
    $scope.timerMessage = '';
    $scope.timerOwnerName = '';
    $scope.isTimerAtBeginning = $scope.timerCounter === DEFAULT_COUNTER;

    $scope.onTimeout = function() {
      $scope.decrementTimer();
      if ($scope.isTimerExpired()) {
        $scope.timerMessage = 'Time is up!';
        $scope.isTimerRunning = false;
        $scope.captureTimer(true);
      } else {
        $scope.renewTimeout();
      }
    };

    $scope.decrementTimer = function() {
      $scope.timerCounter--;
      if ($scope.timerCounter >= 0) {
        $scope.updateTimerDisplay();
      }
      $scope.captureTimer();
    };

    $scope.captureTimer = function(resetOwner) {
      var owner = resetOwner ? null : $scope.fp.user;
      timerRef.set({
        timerCounter: $scope.timerCounter,
        timerMessage: $scope.timerMessage,
        isTimerRunning: $scope.isTimerRunning,
        isTimerAtBeginning: $scope.isTimerAtBeginning,
        owner: owner
      });
    };

    $scope.isTimerExpired = function() {
      return $scope.timerCounter <= 0;
    };

    $scope.renewTimeout = function() {
      timerHandle = $timeout($scope.onTimeout, 1000);
    };

    $scope.formatTime = function() {
      if ($scope.timerCounter < 0) {
        $scope.timerCounter = 0;
      }
      var mins = Math.floor($scope.timerCounter / 60);
      var secs = $scope.timerCounter % 60;
      if (secs < 10) {
        secs = '0' + String(secs);
      }
      return mins + ':' + secs;
    };

    $scope.updateTimerDisplay = function() {
      $scope.timerDisplay = $scope.formatTime();
    };

    $scope.startTimer = function() {
      $scope.renewTimeout();
      $scope.isTimerRunning = true;
      $scope.isTimerAtBeginning = false;
      $scope.captureTimer();
    };

    $scope.pauseTimer = function() {
      $timeout.cancel(timerHandle);
      $scope.isTimerRunning = false;
      $scope.captureTimer();
    };

    $scope.resetTimer = function() {
      $scope.pauseTimer();
      $scope.timerCounter = DEFAULT_COUNTER;
      $scope.updateTimerDisplay();
      $scope.timerMessage = '';
      $scope.isTimerAtBeginning = true;
      $scope.captureTimer(true);
    };

    $scope.updateTimerDisplay();
    /* END   Timer -------------- */

  });
