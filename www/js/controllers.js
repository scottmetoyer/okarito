angular.module('okarito.controllers', ['okarito.services'])

.controller('AppCtrl', function ($scope, $rootScope, $state, $filter, $ionicModal, $timeout, loginService, userService, dataService) {
  var app = this;

  $rootScope.$on('unauthorized', function(event, args) {
    $state.go('login');
  });

  $rootScope.$on('http-error', function(event, args) {
    alert('Connection error.')
    // $state.go('login');
  });

  $rootScope.$on('authorized', function() {
    app.currentUser = userService.getCurrentUser();
  });

  $scope.logout = function() {
    userService.setCurrentUser(null);
    $state.go('login');
  };

  $scope.$on('$ionicView.enter', function(){
    init();
  });

  $scope.setFilter = function(filterId) {
      dataService
        .setFilter(filterId)
        .then(function(response) {
          $rootScope.$broadcast('refresh-cases');
        });
  };

  var init = function() {
    dataService
      .getFilters()
      .then(function (response) {
        $scope.builtinFilters = $filter('filter')(response, { _type: 'builtin' }, true);
        $scope.savedFilters = $filter('filter')(response, { _type: 'saved' }, true);
        $scope.sharedFilters = $filter('filter')(response, { _type: 'shared' }, true);
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

.controller('CasesCtrl', function ($rootScope, $scope, $ionicScrollDelegate, dataService) {
  $scope.filter = '';

  var init = function () {
    dataService
      .getCases($scope.filter)
      .then(function (response) {
        $scope.cases = response;
      })
    };

  $scope.$on('$ionicView.enter', function(){
    init();
  });

  $rootScope.$on('refresh-cases', function() {
    $ionicScrollDelegate.scrollTop();
    init();
  });
})

.controller('CaseCtrl', function ($q, $scope, $stateParams, $ionicModal, $filter, $ionicLoading, dataService, utilityService) {
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
    backup = angular.copy($scope.case);
    $scope.modal.show();
  };
  $scope.closeModal = function() {
    $scope.modal.hide();
  };
  //Cleanup the modal when we're done with it!
  $scope.$on('$destroy', function() {
    $scope.modal.remove();
  });
  // Execute action on hide modal
  $scope.$on('modal.hidden', function() {
    // Execute action
  });
  // Execute action on remove modal
  $scope.$on('modal.removed', function() {
    // Execute action
  });

  var init = function () {
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
      $scope.priorities =  x2js.asArray(responses[1].data.priorities.priority);
      $scope.people =  x2js.asArray(responses[2].data.people.person);
      $scope.categories =  x2js.asArray(responses[3].data.categories.category);
      $scope.milestones =  x2js.asArray(responses[4].data.fixfors.fixfor);
      $scope.areas = x2js.asArray(responses[5].data.areas.area);
      $scope.statuses = x2js.asArray(responses[6].data.statuses.status);

      // Hang child objects off the case to handle the selected list items
      $scope.case.project = $filter('filter')($scope.projects, { ixProject: $scope.case.ixProject }, true)[0];
      $scope.case.priority = $filter('filter')($scope.priorities, { ixPriority: $scope.case.ixPriority }, true)[0];
      $scope.case.personAssignedTo = $filter('filter')($scope.people, { ixPerson: $scope.case.ixPersonAssignedTo }, true)[0];
      $scope.case.category = $filter('filter')($scope.categories, { ixCategory: $scope.case.ixCategory }, true)[0];
      $scope.case.milestone = $filter('filter')($scope.milestones, { ixFixFor: $scope.case.ixFixFor }, true)[0];
      $scope.case.area = $filter('filter')($scope.areas, { ixArea: $scope.case.ixArea }, null)[0];
      $scope.case.status = $filter('filter')($scope.statuses, { ixStatus: $scope.case.ixStatus }, true)[0];

      $scope.$watch("case.sCategory", function(newValue, oldValue) {
        var category = $filter('filter')($scope.categories, { sCategory: $scope.case.sCategory }, true)[0];
        var icon = utilityService.categoryIcon(category.nIconType);
        $scope.iconImage = 'img/' + icon + '.png';
        $scope.icon = 'ion-' + icon;
      });
    });
  };

  $scope.save = function() {
    dataService.saveCase($scope.case)
    .then(function(result){
      $scope.form.edit.$setPristine();
      $scope.closeModal();
    });
  };

  $scope.cancel = function() {
    $scope.case = backup;
    $scope.form.edit.$setPristine();
    $scope.closeModal();
  };

  $scope.$on('$ionicView.enter', function(){
    init();
  });
});
