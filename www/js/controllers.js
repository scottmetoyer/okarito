angular.module('okarito.controllers', ['okarito.services'])

.controller('AppCtrl', function($scope, $rootScope, $state, $filter, $ionicModal, $timeout, loginService, userService, dataService) {
  var app = this;
  $scope.s = {
    searchString: ''
  };

  $rootScope.$on('unauthorized', function(event, args) {
    $state.go('login');
  });

  $rootScope.$on('http-error', function(event, args) {
    // TODO: Handle fundamental HTTP errors here
    // $state.go('login');
  });

  $rootScope.$on('authorized', function() {
    app.currentUser = userService.getCurrentUser();
  });

  $scope.logout = function() {
    userService.setCurrentUser(null);
    $state.go('login');
  };

  $scope.$on('$ionicView.enter', function() {
    init();
  });

  $scope.setFilter = function(filterId) {
    $rootScope.$broadcast('set-filter', {
      filter: filterId
    });
  };

  $scope.search = function() {
    var s = $scope.s.searchString;
    $rootScope.$broadcast('search-cases', {
      search: s
    });

    // Clear the search box
    $scope.s.searchString = '';
  };

  var init = function() {
    dataService
      .getFilters()
      .then(function(response) {
        $scope.builtinFilters = $filter('filter')(response, {
          _type: 'builtin'
        }, true);
        $scope.savedFilters = $filter('filter')(response, {
          _type: 'saved'
        }, true);
        $scope.sharedFilters = $filter('filter')(response, {
          _type: 'shared'
        }, true);
      })
  };
})

.controller('LoginCtrl', function($scope, $rootScope, $state, $ionicPopup, loginService, userService) {
  $scope.data = {
    email: 'scott.metoyer@gmail.com',
    url: 'https://scottmetoyer.fogbugz.com',
    password: ''
  };

  $scope.login = function() {
    loginService
      .loginUser($scope.data.email, $scope.data.password, $scope.data.url)
      .success(function(data) {
        userService.setCurrentUser(data);
        $rootScope.$broadcast('authorized');
        $state.go('app.cases');
      })
      .error(function(data) {
        var alertPopup = $ionicPopup.alert({
          title: 'Unable to connect to FogBugz',
          template: 'Please check your entries and try again'
        });
      });
  }
})

.controller('CasesCtrl', function($rootScope, $scope, $ionicScrollDelegate, $ionicSideMenuDelegate, dataService) {
  $scope.filter = '';

  var init = function() {
    dataService
      .getCases($scope.filter)
      .then(function(response) {
        $scope.cases = response;
      })
  };

  $scope.$on('$ionicView.enter', function() {
    init();
  });

  $rootScope.$on('set-filter', function(event, args) {
    dataService
      .setFilter(args.filter)
      .then(function(response) {
        // Set filter name to the screen

        // Clear custom search
        $scope.filter = '';

        // Refresh case list
        init();
      })
    $ionicScrollDelegate.scrollTop();
    init();
  });

  $scope.$on('search-cases', function(event, args) {
    $ionicScrollDelegate.scrollTop();
    $scope.filter = args.search;
    init();
    $ionicSideMenuDelegate.toggleLeft(false);
  });
})

.controller('CaseCtrl', function($q, $scope, $stateParams, $timeout, $ionicModal, $filter, $ionicLoading, dataService, utilityService) {
  var x2js = new X2JS();
  var backup = {};
  $scope.form = {};

  // Set up the edit modal
  $ionicModal.fromTemplateUrl('templates/edit.html', {
    scope: $scope,
    animation: 'slide-in-up'
  }).then(function(modal) {
    $scope.modal = modal;
  });
  $scope.editCase = function() {
    // Backup the case to support non-destructive edit
    angular.copy($scope.case, backup);
    $scope.modal.show();
  };
  $scope.closeModal = function() {
    console.log($scope.case);
    $scope.modal.hide();
  };
  $scope.$on('$destroy', function() {
    $scope.modal.remove();
  });
  $scope.$on('modal.hidden', function() {});
  $scope.$on('modal.removed', function() {});

  var init = function() {
    $scope.case = dataService.getCase($stateParams.caseId);
    $scope.events = x2js.asArray($scope.case.events.event);
    $scope.tags = x2js.asArray($scope.case.tags.tag);

    if ($scope.tags[0] == null) {
      $scope.tags = [];
    }

    // Populate the dropdowns in the edit view
    $q.all([
        dataService.getProjects(),
        dataService.getPriorities(),
        dataService.getPeople(),
        dataService.getCategories(),
        dataService.getMilestones($scope.case.ixProject),
        dataService.getAreas($scope.case.ixProject),
        dataService.getStatuses($scope.case.ixCategory)
      ])
      .then(function(responses) {
        $scope.projects = responses[0];
        $scope.priorities = responses[1];
        $scope.people = responses[2];
        $scope.categories = responses[3];
        $scope.milestones = responses[4];
        $scope.areas = responses[5];
        $scope.statuses = responses[6];

        $scope.$watch("case.sCategory", function(newValue, oldValue) {
          var category = $filter('filter')($scope.categories, {
            text: $scope.case.sCategory.__cdata
          }, true)[0];
          var icon = utilityService.categoryIcon(category.nIconType);
          $scope.iconImage = 'img/' + icon + '.png';
          $scope.icon = 'ion-' + icon;
        });
      });
  };

  $scope.save = function() {
    dataService.saveCase($scope.case)
      .then(function(result) {
        $scope.closeModal();
      });
  };

  $scope.cancel = function() {
    angular.copy(backup, $scope.case);
    $scope.closeModal();
  };

  $scope.$on('$ionicView.enter', function() {
    init();
  });
});
