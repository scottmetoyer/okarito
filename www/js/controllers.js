angular.module('okarito.controllers', ['okarito.services'])

.controller('AppCtrl', function($scope, $rootScope, $state, $filter, $ionicLoading, $ionicModal, $timeout, loginService, userService, dataService) {
  var app = this;
  $scope.s = {
    searchString: ''
  };

  $rootScope.$on('unauthorized', function(event, args) {
    $ionicLoading.hide();
    $state.go('login');
  });

  $rootScope.$on('http-error', function(event, args) {
    // TODO: Handle fundamental HTTP errors here
    // $state.go('login');
    $ionicLoading.hide();
  });

  $rootScope.$on('authorized', function() {
    app.currentUser = userService.getCurrentUser();
  });

  $scope.$on('$ionicView.enter', function() {
    init();
  });

  $scope.logout = function() {
    userService.setCurrentUser(null);
    $state.go('login');
  };

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

.controller('LoginCtrl', function($scope, $rootScope, $state, $filter, $ionicPopup, loginService, userService, dataService) {
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

        // Fetch the users full name
        dataService.getPeople(true)
          .then(function(response) {
            var fullName = $filter('filter')(response, {
              email: $scope.data.email
            }, true)[0].text;

            data.full_name = fullName;
            userService.setCurrentUser(data);
          });

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

.controller('CasesCtrl', function($q, $filter, $rootScope, $scope, $ionicLoading, $ionicScrollDelegate, $ionicSideMenuDelegate, $ionicModal, dataService, userService, caseModalService) {
  $scope.filter = '';
  $scope.filterDescription = '';
  $scope.ready = false;

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
    $scope.case = dataService.stubCase();
    $scope.newModal();
  }

  $scope.save = function() {
    dataService.newCase($scope.case)
      .then(function(result) {
        $scope.closeModal();
      });
  };

  $scope.doRefresh = function() {
    $scope.$broadcast('scroll.refreshComplete');
    $scope.$apply();
  };

  $scope.cancel = function() {
    $scope.closeModal();
  };

  $scope.$on('$ionicView.enter', function() {
    init();
  });

  $scope.$on('$ionicView.loaded', function() {
    loadCases();
  });

  $rootScope.$on('set-filter', function(event, args) {
    dataService
      .setFilter(args.filter)
      .then(function(response) {
        // Clear custom search
        $scope.filter = '';

        // Refresh case list
        loadCases();
      });

    $ionicScrollDelegate.scrollTop();
  });

  $scope.$on('search-cases', function(event, args) {
    $ionicScrollDelegate.scrollTop();
    $scope.filter = args.search;
    loadCases();
    $ionicSideMenuDelegate.toggleLeft(false);
  });

  var loadCases = function() {
    $ionicLoading.show({
      template: 'Loading...'
    });

    // Load the related entity lists
    $q.all([
        dataService.getProjects(false),
        dataService.getPriorities(false),
        dataService.getPeople(false),
        dataService.getCategories(false),
        dataService.getCases($scope.filter, false)
      ])
      .then(function(responses) {
        $rootScope.projects = responses[0];
        $rootScope.priorities = responses[1];
        $rootScope.people = responses[2];
        $rootScope.categories = responses[3];
        $scope.cases = responses[4].cases;

        $scope.filterDescription = responses[4].description;
        $ionicLoading.hide();
        $scope.ready = true;
      });
  }

  var init = function() {
    $scope.ready = false;
  };
})

.controller('CaseCtrl', function($q, $scope, $rootScope, $stateParams, $timeout, $ionicModal, $ionicPopover, $filter, $ionicLoading, dataService, utilityService, userService, caseModalService) {
  var x2js = new X2JS();
  var backup = {};

  // Action popover
  $ionicPopover.fromTemplateUrl('templates/more-actions.html', {
    scope: $scope,
  }).then(function(popover) {
    $scope.popover = popover;
  });

  $scope.editModal = function() {
    caseModalService
      .init('templates/edit.html', $scope)
      .then(function(modal) {
        modal.show();
      });
  };

  $scope.resolveModal = function() {
    caseModalService
      .init('templates/resolve.html', $scope)
      .then(function(modal) {
        modal.show();
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

  $scope.resolveCase = function() {
    $scope.label = 'Resolve Case ' + $scope.case.ixBug;
    $scope.touched = 'Resolved by ' + userService.getCurrentUser().full_name;

    angular.copy($scope.case, backup);
    $scope.resolveModal();
  };

  $scope.editCase = function() {
    $ionicLoading.show({
      template: 'Loading...'
    });

    $scope.label = 'Edit Case ' + $scope.case.ixBug + ' (' + $scope.case.sStatus.__cdata + ')';
    $scope.touched = 'Edited by ' + userService.getCurrentUser().full_name;

    // Backup the case to support non-destructive edit
    angular.copy($scope.case, backup);

    $scope.closePopover();
    $scope.editModal();

    // Load related entities for dropdown lists
    $q.all([
        dataService.getMilestones($scope.case.ixProject, false),
        dataService.getAreas($scope.case.ixProject, false),
        dataService.getStatuses($scope.case.ixCategory, false)
      ])
      .then(function(responses) {
        $scope.milestones = responses[0];
        $scope.areas = responses[1];
        $scope.statuses = responses[2];

        $ionicLoading.hide();
      });
  };

  $scope.openPopover = function($event) {
    $scope.popover.show($event);
  };

  $scope.closePopover = function() {
    $scope.popover.hide();
  };

  $scope.$on('$ionicView.enter', function() {
    init();
  });

  $scope.$on('$ionicView.beforeEnter', function() {
    $scope.ready = false;
  });

  var init = function() {
    $scope.case = dataService.getCase($stateParams.caseId);
    $scope.events = x2js.asArray($scope.case.events.event);
    $scope.tags = x2js.asArray($scope.case.tags.tag);
    $scope.tags = $scope.tags[0] == undefined ? [] : $scope.tags;
    $scope.date = $filter('date')(new Date(), 'medium');
    $scope.$watch('case.sCategory', function(newValue, oldValue) {
      var category = $filter('filter')($rootScope.categories, {
        text: $scope.case.sCategory.__cdata
      }, true)[0];

      var icon = utilityService.categoryIcon(category.icon);
      $scope.iconImage = 'img/' + icon + '.png';
      $scope.icon = 'ion-' + icon;
    });

    $scope.ready = true;
  };
});
