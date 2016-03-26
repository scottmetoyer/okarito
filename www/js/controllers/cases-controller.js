angular.module('okarito.controllers')

.controller('CasesCtrl', function($q, $filter, $rootScope, $state, $scope, $ionicLoading, $ionicScrollDelegate, $ionicSideMenuDelegate, $ionicModal, dataService, userService, caseModalService) {
  $scope.filter = '';
  $scope.filterDescription = '';
  $scope.ready = false;
  $scope.max = 25;
  $rootScope.attachments = [];

  $scope.newModal = function() {
    caseModalService
      .init('templates/edit.html', $scope)
      .then(function(modal) {
        modal.show();
      });
  };

  $scope.newCase = function() {
    $scope.label = 'New case';
    $scope.date = $filter('date')(new Date(), 'medium');
    $scope.touched = 'Opened by ' + userService.getCurrentUser().full_name;
    $rootScope.attachments = [];
    $scope.case = dataService.stubCase();
    $scope.newModal();
  }

  $scope.save = function() {
    dataService.saveCase($scope.case, 'new', $rootScope.attachments)
      .then(function(result) {
        // Clear the sub objects
        $rootScope.attachments = [];

        // Received customer feedback to go back to filter view after creating a case - testing this out
        $ionicLoading.show({
          template: '<ion-spinner class="overlay" icon="lines"></ion-spinner>'
        });

        loadCases();

        $scope.closeModal();
      });
  };

  $scope.doRefresh = function() {
    loadCases();
  };

  $scope.cancel = function() {
    $scope.closeModal();
  };

  $scope.showAll = function() {
    $scope.max = 99999;

    $ionicLoading.show({
      template: '<ion-spinner class="overlay" icon="lines"></ion-spinner>'
    });

    loadCases();
  };

  $scope.$on('$ionicView.loaded', function() {
    $ionicLoading.show({
      template: '<ion-spinner class="overlay" icon="lines"></ion-spinner>'
    });

    loadCases();
  });

  $scope.$on('set-filter', function(event, args) {
    $ionicLoading.show({
      template: '<ion-spinner class="overlay" icon="lines"></ion-spinner>'
    });

    $scope.max = 25;
    dataService
      .setFilter(args.filter)
      .then(function(response) {
        // Clear custom search and refresh the case list
        $scope.filter = '';
        loadCases();
      });

    $ionicScrollDelegate.scrollTop();
  });

  $scope.$on('search-cases', function(event, args) {
    $ionicLoading.show({
      template: '<ion-spinner class="overlay" icon="lines"></ion-spinner>'
    });

    $scope.max = 25;
    $ionicScrollDelegate.scrollTop();
    $scope.filter = args.search;
    loadCases().then(function() {
      // If there is only one case in the cases list, just open it
      if ($scope.cases.length == 1) {
        $state.go('app.single', {
          id: 0
        });
      }
    });
    $ionicSideMenuDelegate.toggleLeft(false);
  });

  $scope.$on('error', function(event, args) {
    $ionicLoading.hide();
    $scope.ready = true;

    var alertPopup = $ionicPopup.alert({
      title: 'FogBugz Error',
      template: args.message,
      buttons: [{
        text: 'OK',
        type: 'button-stable',
        onTap: function(e) {
          return;
        }
      }]
    });
  });

  var loadCases = function() {
    // Load the related entity lists
    return $q.all([
        dataService.getProjects(false),
        dataService.getPriorities(false),
        dataService.getPeople(false),
        dataService.getCategories(false),
        dataService.getStatuses(null, false, false)
      ])
      .then(function(responses) {
        $rootScope.projects = responses[0];
        $rootScope.priorities = responses[1];
        $rootScope.people = responses[2];
        $rootScope.categories = responses[3];
        $rootScope.allStatuses = responses[4];

        return dataService.getCases($scope.filter, false, $scope.max);
      })
      .then(function(response) {
        $scope.cases = response.cases;
        $scope.filterDescription = response.description;
        $scope.count = response.count;

        // Hide loaders
        $ionicLoading.hide();
        $scope.$broadcast('scroll.refreshComplete');
        $scope.ready = true;
      });
  }
});
