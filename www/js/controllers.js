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

  $rootScope.$on('unauthorized', function(event, args) {
    // Null the user object
    userService.setCurrentUser(null);

    // Show the login modal
    $scope.message = args.message;

    if ($scope.loginModal) {
      $scope.loginModal.show();
    }
  });

  $rootScope.$on('authorized', function() {
    app.currentUser = userService.getCurrentUser();
    $scope.loginModal.hide();
  });

  // Handle the login action when the user submits the login form
  $scope.doLogin = function () {
    var password = $scope.loginData.password;
    var email = $scope.loginData.email;
    var root = $scope.loginData.url;

    var user = userService.getCurrentUser();
    user.email = email;

    root = root.replace(/\/?$/, '/');

    dataService
      .getApiUrl(root)
      .then(function (response) {
        var apiUrl = root + response.data.response.url.__cdata;
        user.api_url = apiUrl;

        return userService.loginUser(
          email,
          password,
          apiUrl)
      })
      .then(function (response) {
        var token = response.data.response.token.__cdata;
        user.access_token = token;

        // Persist the authenticated user
        userService.setCurrentUser(user);
        $rootScope.$broadcast('authorized');
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
