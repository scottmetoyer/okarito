angular.module('okarito.controllers', ['okarito.services'])

.controller('AppCtrl', function ($scope, $ionicModal, $timeout) {
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

    $scope.$on('event:auth-loginRequired', function(e, rejection) {
      $scope.loginModal.show();
    });

    $scope.$on('event:auth-loginConfirmed', function() {
       $scope.loginModal.hide();
    });

    $scope.$on('event:auth-login-failed', function(e, status) {
      var error = "Login failed.";
      if (status == 401) {
        error = "Invalid username or password.";
      }
      $scope.message = error;
    });

    $scope.$on('event:auth-logout-complete', function() {
      $state.go('app.cases', { }, { reload: true, inherit: false });
    });

    // Perform the login action when the user submits the login form
    $scope.doLogin = function () {
      // authService.loginConfirmed();
      /*
        var properties = {};
        var root = $scope.loginData.url;
        root = root.replace(/\/?$/, '/');

        authService
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
            });*/
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
            })
            .catch(function (response) {
                alert("Error loading cases");
            });
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
