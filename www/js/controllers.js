angular.module('okarito.controllers', ['okarito.services'])

.controller('AppCtrl', function ($scope, $rootScope, $state, $ionicModal, $timeout, loginService, userService) {
  var app = this;

  $rootScope.$on('unauthorized', function(event, args) {
    $state.go('login');
  });

  $rootScope.$on('http-error', function(event, args) {
    $state.go('login');
  });

  $rootScope.$on('authorized', function() {
    app.currentUser = userService.getCurrentUser();
  });

  $scope.logout = function() {
    userService.setCurrentUser(null);
    $state.go('login');
  }
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

.controller('CasesCtrl', function ($scope, dataService) {
  $scope.filter = '';
  $scope.cases = [];

  var init = function () {
    dataService
      .getCases($scope.filter)
      .then(function (response) {
        $scope.cases = response.data.cases;
      })
    };

    $scope.$on('$ionicView.enter', function(){
      init();
    });
})

.controller('CaseCtrl', function ($q, $scope, $stateParams, $ionicModal, $filter, dataService) {
  var x2js = new X2JS();

  // Lists for the selects and bug events view
  $scope.projects = {};
  $scope.priorities = {};
  $scope.milestones = {};
  $scope.people = {};
  $scope.areas = {};
  $scope.categories = {};
  $scope.events = {};
  $scope.tags = {};

  // Properties for the selected items
  $scope.case = {};
  $scope.project = {};
  $scope.priority = {};
  $scope.milestone = {};
  $scope.person = {};
  $scope.area = {};
  $scope.category = {};

  // Set up the edit modal
  $ionicModal.fromTemplateUrl('templates/edit.html', {
    scope: $scope,
    animation: 'slide-in-up'
  }).then(function(modal) {
    $scope.modal = modal;
  });
  $scope.editCase = function() {
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

  function showEdit() {
    $q.all([
        dataService.getProjects(),
        dataService.getPriorities(),
        dataService.getPeople(),
        dataService.getCategories(),
        dataService.getMilestones($stateParams.projectId),
        dataService.getAreas($stateParams.projectId),
        dataService.getCase($stateParams.caseId)
    ])
    .then(function(responses) {
      $scope.projects = x2js.asArray(responses[0].data.projects.project);
      $scope.priorities =  x2js.asArray(responses[1].data.priorities.priority);
      $scope.people =  x2js.asArray(responses[2].data.people.person);
      $scope.categories =  x2js.asArray(responses[3].data.categories.category);
      $scope.milestones =  x2js.asArray(responses[4].data.fixfors.fixfor);
      $scope.areas = x2js.asArray(responses[5].data.areas.area);

      $scope.project = $filter('filter')($scope.projects, { ixProject: $scope.case.ixProject }, null)[0];
      $scope.priority = $filter('filter')($scope.priorities, { ixPriority: $scope.case.ixPriority }, null)[0];
      $scope.milestone = $filter('filter')($scope.milestones, { ixFixFor: $scope.case.ixFixFor }, null)[0];
      $scope.person = $filter('filter')($scope.people, { ixPerson: $scope.case.ixPersonAssignedTo }, null)[0];
      $scope.area = $filter('filter')($scope.areas, { ixArea: $scope.case.ixArea }, null)[0];
      $scope.category = $filter('filter')($scope.categories, { ixCategory: $scope.case.ixCategory }, null)[0];
    });
  }

  var init = function () {
    dataService.getCase($stateParams.caseId)
    .then(function(response) {
      $scope.case = response.data.cases.case;
      $scope.events = x2js.asArray($scope.case.events.event);
      $scope.tags = x2js.asArray($scope.case.tags.tag);

      if ($scope.tags[0] == null) {
        $scope.tags = [];
      }
    });
  };

  $scope.$on('$ionicView.enter', function(){
    init();
  });
});
