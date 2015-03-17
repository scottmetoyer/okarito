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
        $scope.cases = response.data.response.cases.case;
      })
    };

    $scope.$on('$ionicView.enter', function(){
      init();
    });
})

.controller('CaseCtrl', function ($scope, $stateParams, dataService) {
    $scope.case = {};

    var init = function () {
      dataService
        .getCase($stateParams.caseId)
        .then(function (response) {
          // TODO: Can this return more than one result? How do we handle?
          $scope.case = response.data.response.cases.case;
        })
    };

    $scope.$on('$ionicView.enter', function(){
      init();
    });
});
