angular.module('okarito.controllers', ['okarito.services'])

.controller('AppCtrl', function($scope, $rootScope, $state, $filter, $ionicLoading, $ionicPopup, $ionicModal, $timeout, loginService, userService, dataService) {
  var app = this;
  $scope.s = {
    searchString: ''
  };

  $rootScope.$on('not-logged-in', function(event) {
    $ionicLoading.hide();
    $state.go('login');
  });

  $rootScope.$on('unauthorized', function(event, args) {
    $ionicLoading.hide();

    var alertPopup = $ionicPopup.alert({
      title: 'Authentication error',
      template: args.message
    });

    $state.go('login');
  });

  $rootScope.$on('request-error', function(event, args) {
    $ionicLoading.hide();

    var alertPopup = $ionicPopup.alert({
      title: 'Request error',
      template: args.message
    });
  });

  $rootScope.$on('error', function(event, args) {
    $ionicLoading.hide();

    var alertPopup = $ionicPopup.alert({
      title: 'FogBugz Error',
      template: args.message
    });
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
      });

      $scope.currentUser = userService.getCurrentUser();
  };
})

.controller('LoginCtrl', function($scope, $rootScope, $state, $filter, $ionicPopup, $ionicModal, loginService, userService, dataService) {
  $scope.data = {
    email: 'scott.metoyer@gmail.com',
    url: 'https://scottmetoyer.fogbugz.com',
    password: ''
  };

  $scope.$on('ambiguous-login', function(event, args) {
    var people = args.people;
    $scope.items = [];
    $scope.headerText = "Choose person";

    for (var i = 0; i < people.length; i++) {
      $scope.items.push({
        id: people[i].__cdata,
        text: people[i].__cdata
      });
    }

    $ionicModal.fromTemplateUrl(
      'templates/ambiguous-login.html', {
        'scope': $scope
      })
      .then(function(modal) {
        $scope.modal = modal;
        $scope.modal.show();
    });

    $scope.hideItems = function() {
      $scope.modal.hide();
    }

    $scope.$on('$destroy', function() {
      $scope.modal.remove();
    });

    $scope.validateSingle = function(item) {
      // Resend the login request, passing in the appropriate name
      loginUser(item.text, $scope.data.password, $scope.data.url, true);
      $scope.modal.hide();
    };
  });

  $scope.login = function() {
    loginUser($scope.data.email, $scope.data.password, $scope.data.url, false);
  };

  function loginUser(id, password, url, multipleEmails) {
    loginService
      .loginUser(id, password, url)
      .success(function(data) {
        userService.setCurrentUser(data);

        // Fetch the users details
        dataService.getPeople(true)
          .then(function(response) {
            // Filter on email or username
            var user = {};

            if (multipleEmails == false) {
              user = $filter('filter')(response, {
                email: $scope.data.email
              }, true)[0];
            } else {
              user = $filter('filter')(response, {
                text: id
              }, true)[0];
            }

            data.full_name = user.text;
            data.user_id = user.id;
            userService.setCurrentUser(data);
          });

          // TODO: Clear out scope data on successful login
          // $scope.data = {};
          $rootScope.$broadcast('authorized');
          $state.go('app.cases');
      });
  }
})

.controller('CasesCtrl', function($q, $filter, $rootScope, $state, $scope, $ionicLoading, $ionicScrollDelegate, $ionicSideMenuDelegate, $ionicModal, dataService, userService, caseModalService) {
  $scope.filter = '';
  $scope.filterDescription = '';
  $scope.ready = false;
  $scope.max = 25;

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
    dataService.saveCase($scope.case, 'new')
      .then(function(result) {
        $scope.closeModal();
        loadCases();
      });
  };

  $scope.doRefresh = function() {
    loadCases();
  };

  $scope.cancel = function() {
    $scope.closeModal();
  };

  $scope.showAll = function() {
    $ionicLoading.show({
      template: '<ion-spinner class="overlay" icon="lines"></ion-spinner>'
    });

    $scope.max = 99999;
    loadCases();
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

    $scope.max = 25;
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

    $scope.max = 25;
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
        dataService.getCases($scope.filter, false, $scope.max),
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
        $scope.count = responses[4].count;

        // Hide loaders
        $ionicLoading.hide();
        $scope.$broadcast('scroll.refreshComplete');
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
    loadCases();
  };
})

.controller('CaseCtrl', function($q, $scope, $sce, $rootScope, $stateParams, $timeout, $ionicModal, $ionicPopover, $filter, $ionicLoading, dataService, utilityService, userService, caseModalService, cameraService) {
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
    caseModalService.init('templates/edit.html', $scope)
      .then(function(modal) {
        modal.show();
      });
  };

  $scope.resolveModal = function() {
    caseModalService.init('templates/resolve.html', $scope)
      .then(function(modal) {
        modal.show();
      });
  };

  $scope.reopenModal = function() {
    caseModalService.init('templates/reopen.html', $scope)
      .then(function(modal) {
        modal.show();
      });
  };

  $scope.reactivateModal = function() {
    caseModalService.init('templates/reactivate.html', $scope)
      .then(function(modal) {
        modal.show();
      });
  };

  $scope.closeCaseModal = function() {
    caseModalService.init('templates/close.html', $scope)
      .then(function(modal) {
        modal.show();
      });
  };

  $scope.save = function(command) {
    $scope.working = true;
    $scope.closeModal();

    dataService.saveCase($scope.case, command)
      .then(function(result) {
        dataService.refreshCase($scope.case.ixBug)
          .then(function() {
            $scope.working = false;
          });
      });
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

  $scope.camera = function() {
    cameraService.getPicture().then(function(imageURI) {
      console.log(imageURI);
    }, function(err) {
      console.log(err);
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
    $scope.label = 'Resolve Case ' + $scope.case.ixBug;
    $scope.touched = 'Resolved by ' + userService.getCurrentUser().full_name;

    $scope.closePopover();
    $scope.resolveModal();

    prepareModal().then(function() {
      $scope.case.ixStatus = $scope.statuses[0].id;
      $scope.case.sStatus.__cdata = $scope.statuses[0].text;
    });
  };

  $scope.reactivateCase = function() {
    $scope.label = 'Reactivate Case ' + $scope.case.ixBug;
    $scope.touched = 'Reactivated by ' + userService.getCurrentUser().full_name;

    $scope.closePopover();
    $scope.reactivateModal();
    prepareModal().then(function() {});
  };

  $scope.reopenCase = function() {
    $scope.label = 'Reopen Case ' + $scope.case.ixBug;
    $scope.touched = 'Reopened by ' + userService.getCurrentUser().full_name;

    $scope.closePopover();
    $scope.reopenModal();
    prepareModal().then(function() {
      console.log(userService.getCurrentUser());
      $scope.case.ixPersonAssignedTo = userService.getCurrentUser().user_id;
      $scope.case.sPersonAssignedTo.__cdata = userService.getCurrentUser().full_name;
    });
  };

  $scope.closeCase = function() {
    $scope.label = 'Close Case ' + $scope.case.ixBug;
    $scope.touched = 'Closed by ' + userService.getCurrentUser().full_name;

    angular.copy($scope.case, backup);
    $scope.closePopover();
    $scope.closeCaseModal();
  };

  $scope.editCase = function() {
    $scope.label = 'Edit Case ' + $scope.case.ixBug + ' (' + $scope.case.sStatus.__cdata + ')';
    $scope.touched = 'Edited by ' + userService.getCurrentUser().full_name;

    $scope.closePopover();
    $scope.editModal();
    prepareModal().then(function() {});
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

  var prepareModal = function() {
    $ionicLoading.show({
      template: '<ion-spinner class="overlay" icon="lines"></ion-spinner>'
    });

    // Backup the case to support non-destructive edit
    angular.copy($scope.case, backup);

    return $q.all([
        dataService.getMilestones($scope.case.ixProject, false),
        dataService.getAreas($scope.case.ixProject, false),
        dataService.getStatuses($scope.case.ixCategory, true, false)
      ])
      .then(function(responses) {
        $scope.milestones = responses[0];
        $scope.areas = responses[1];
        $scope.statuses = responses[2];
        $ionicLoading.hide();
      });
  }

  var init = function() {
    $scope.case = dataService.getCase($stateParams.caseId);
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
