angular.module('okarito.controllers', ['okarito.services'])

.controller('AppCtrl', function ($scope, $rootScope, $ionicModal, $timeout, userService) {
  var app = this;
  $scope.message = '';

  $scope.loginData = {
    email: 'scott.metoyer@gmail.com',
    url: 'https://scottmetoyer.fogbugz.com',
    password: ''
  };

  // Create the login modal that we will use later
  $ionicModal.fromTemplateUrl('templates/login.html', function(modal) {
    $scope.loginModal = modal;
  }, {
    scope: $scope,
    hardwareBackButtonClose: false,
    focusFirstInput: true
  });

  $scope.$on('$destroy', function() {
    $scope.loginModal.remove();
  });

  $rootScope.$on('unauthorized', function() {
    // Null the user object
    app.currentUser = userService.setCurrentUser(null);

    // Show the login modal
    $scope.loginModal.show();
  });

    $rootScope.$on('authorized', function() {
      $scope.loginModal.hide();
    });

    // Perform the login action when the user submits the login form
    $scope.doLogin = function () {
      var user = userService.getCurrentUer();
      var root = $scope.loginData.url;
      root = root.replace(/\/?$/, '/');

      dataService
            .getApiUrl(root)
            .then(function (response) {
                var apiUrl = root + response.data.response.url.__cdata;

                // Persist the API url
                window.localStorage.setItem('apiUrl', apiUrl);

                return authService.loginUser(
                    $scope.loginData.email,
                    $scope.loginData.password,
                    apiUrl)
            })
            .then(function (response) {
                var token = response.data.response.token.__cdata;

                // Persist the authentication token
                window.localStorage('token', token);

                $scope.closeLogin();
            })
            .catch(function (response) {
                alert('There was an error logging in to FogBugz. Please check your entries and try again.');
            });
    };
})

.controller('CasesCtrl', function ($scope, dataService) {
  $scope.filter = '';
  $scope.cases = [];

  var init = function () {
    dataService
      .getCases($scope.filter)
      .then(function (response) {
        $scope.cases = response.data.response.cases.case;
      }).catch(function (error) {
        console.log('Error loading cases: ' + error);
      })
    };

    init();
})

.controller('CaseCtrl', function ($scope, $stateParams, dataService) {
    $scope.case = {};
    $scope.apiUrl = window.localStorage.getItem('apiUrl');

    var init = function () {
      /*
        dataService
            .getCase($stateParams.caseId)
            .then(function (response) {
                $scope.case = response.data.response.cases.case[0];
            })
            .catch(function (response) {
                alert("Error loading case");
            });;*/
    }

    init();
});
