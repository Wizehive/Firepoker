angular.module('firePokerApp')
  .filter('closedStatus', function () {
    return function (items) {
      if (items) {

        var filtered = [];
        for (var i = 0; i < items.length; i++) {
          var item = items[i];
          if (item.status == 'closed') {
            filtered.push(item);
          }
        }
        return filtered;
      }
    };
  });