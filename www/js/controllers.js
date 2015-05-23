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

.controller('CasesCtrl', function($q, $filter, $rootScope, $state, $scope, $ionicLoading, $ionicScrollDelegate, $ionicSideMenuDelegate, $ionicModal, dataService, userService, caseModalService) {
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
    loadCases();
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
    $ionicLoading.show({
      template: '<ion-spinner class="overlay" icon="lines"></ion-spinner>'
    });

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
    $ionicLoading.show({
      template: '<ion-spinner class="overlay" icon="lines"></ion-spinner>'
    });

    $ionicScrollDelegate.scrollTop();
    $scope.filter = args.search;
    loadCases();
    $ionicSideMenuDelegate.toggleLeft(false);
  });

  var loadCases = function() {
    // Load the related entity lists
    $q.all([
        dataService.getProjects(false),
        dataService.getPriorities(false),
        dataService.getPeople(false),
        dataService.getCategories(false),
        dataService.getCases($scope.filter, false),
        dataService.getStatuses(null, false, false)
      ])
      .then(function(responses) {
        $rootScope.projects = responses[0];
        $rootScope.priorities = responses[1];
        $rootScope.people = responses[2];
        $rootScope.categories = responses[3];
        $scope.cases = responses[4].cases;
        $rootScope.allStatuses = responses[5];
        $scope.filterDescription = responses[4].description;

        // Hide loaders
        $ionicLoading.hide();
        $scope.$broadcast('scroll.refreshComplete');
        $scope.$apply()
        $scope.ready = true;

        // If there is only one case in the cases list, just open it
        if ($scope.cases.length == 1) {
          $state.go('app.single', {
            caseId: $scope.cases[0].ixBug
          });
        }
      });
  }

  var init = function() {
    $scope.ready = false;
  };
})

.controller('CaseCtrl', function($q, $scope, $sce, $rootScope, $stateParams, $timeout, $ionicModal, $ionicPopover, $filter, $ionicLoading, dataService, utilityService, userService, caseModalService) {
  var x2js = new X2JS();
  var backup = {};
  $scope.working = false;
  $scope.caseResolved = false;

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

  $scope.reactivateModal = function() {
    caseModalService
      .init('templates/reactivate.html', $scope)
      .then(function(modal) {
        modal.show();
      });
  };

  $scope.closeCaseModal = function() {
    caseModalService
      .init('templates/close.html', $scope)
      .then(function(modal) {
        modal.show();
      });
  };

  $scope.save = function(command) {
    $scope.working = true;
    $scope.closeModal();

    if (command == 'resolve') {
      dataService.resolveCase($scope.case)
        .then(function(result) {
          dataService.refreshCase($scope.case.ixBug)
            .then(function() {
                $scope.working = false;
          });
        });
    }

    if (command == 'close') {
      dataService.closeCase($scope.case)
        .then(function(result) {
          dataService.refreshCase($scope.case.ixBug)
            .then(function() {
                $scope.working = false;
          });
        });
    }

    if (command == 'edit') {
      dataService.saveCase($scope.case)
        .then(function(result) {
          dataService.refreshCase($scope.case.ixBug)
            .then(function() {
                $scope.working = false;
          });
        });
    }
  };

  $scope.cancel = function() {
    angular.copy(backup, $scope.case);
    $scope.closeModal();
  };

  $scope.showAssign = function(e) {
    $scope.closePopover();
    $scope.showItems(e);
  };

  $scope.refreshCase = function() {
    $scope.working = true;
    $scope.closePopover();

    dataService.refreshCase($scope.case.ixBug)
      .then(function() {
        $scope.working = false;
      });
  };

  $scope.emailCase = function() {};

  $scope.assignCase = function(val, text) {
    $scope.working = true;
    $scope.case.ixPersonAssignedTo = val;
    $scope.case.sPersonAssignedTo.__cdata = text;

    dataService.assignCase($scope.case)
      .then(function(result) {
        dataService.refreshEvents($scope.case)
          .then(function() {
            $scope.working = false;
          });
      });
  };

  $scope.resolveCase = function() {
    $ionicLoading.show({template: '<ion-spinner class="overlay" icon="lines"></ion-spinner>'});
    $scope.label = 'Resolve Case ' + $scope.case.ixBug;
    $scope.touched = 'Resolved by ' + userService.getCurrentUser().full_name;

    angular.copy($scope.case, backup);
    $scope.closePopover();
    $scope.resolveModal();

    // Load related entities for dropdown lists
    $q.all([
        dataService.getMilestones($scope.case.ixProject, false),
        dataService.getAreas($scope.case.ixProject, false),
        dataService.getStatuses($scope.case.ixCategory, true, false)
      ])
      .then(function(responses) {
        $scope.milestones = responses[0];
        $scope.areas = responses[1];
        $scope.statuses = responses[2];
        $scope.case.ixStatus = $scope.statuses[0].id;
        $scope.case.sStatus.__cdata = $scope.statuses[0].text;

        $ionicLoading.hide();
      });
  };

  $scope.resolveAndCloseCase = function() {
    $scope.label = 'Resolve and Close Case ' + $scope.case.ixBug;
    $scope.touched = 'Resolved and closed by ' + userService.getCurrentUser().full_name;

    angular.copy($scope.case, backup);
    $scope.closePopover();
    $scope.resolveModal();
  };

  $scope.reactivateCase = function() {
    $scope.label = 'Reactivate Case ' + $scope.case.ixBug;
    $scope.touched = 'Reactivated by ' + userService.getCurrentUser().full_name;

    angular.copy($scope.case, backup);
    $scope.closePopover();
    $scope.reactivateModal();
  };

  $scope.closeCase = function() {
    $scope.label = 'Close Case ' + $scope.case.ixBug;
    $scope.touched = 'Closed by ' + userService.getCurrentUser().full_name;

    angular.copy($scope.case, backup);
    $scope.closePopover();
    $scope.closeCaseModal();
  };

  $scope.editCase = function() {
    $ionicLoading.show({template: '<ion-spinner class="overlay" icon="lines"></ion-spinner>'});
    $scope.label = 'Edit Case ' + $scope.case.ixBug + ' (' + $scope.case.sStatus.__cdata + ')';
    $scope.touched = 'Edited by ' + userService.getCurrentUser().full_name;

    // Backup the case to support non-destructive edit
    angular.copy($scope.case, backup);

    $scope.closePopover();
    $scope.editModal();

    // Load related entities for dropdown lists
    $q.all([
        dataService.getMilestones($scope.case.ixProject, false),
        dataService.getAreas($scope.case.ixProject, false)
      ])
      .then(function(responses) {
        $scope.milestones = responses[0];
        $scope.areas = responses[1];
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
    $scope.tags = x2js.asArray($scope.case.tags.tag);
    $scope.tags = $scope.tags[0] == undefined ? [] : $scope.tags;
    $scope.date = $filter('date')(new Date(), 'medium');

    $scope.$watch('case.ixStatus', function(newValue, oldValue) {
      var status = $filter('filter')($rootScope.allStatuses, {
        id: $scope.case.ixStatus
      }, true)[0];

      $scope.caseResolved = status.resolved;
    });

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
