angular.module('okarito.controllers', ['okarito.services'])

.controller('AppCtrl', function ($scope, $ionicModal, $timeout, authService) {
    // Form data for the login modal
    $scope.loginData = {};
    $scope.loginData.email = 'scott.metoyer@gmail.com';
    $scope.loginData.url = 'https://scottmetoyer.fogbugz.com';
    $scope.loginData.password = '';

    // Create the login modal that we will use later
    $ionicModal.fromTemplateUrl('templates/login.html', {
        scope: $scope,
        hardwareBackButtonClose: false
    }).then(function (modal) {
        $scope.modal = modal;

        // Check for a saved token - open login as needed
        var token = authService.getToken();
        if (token == null) {
            $scope.login();
        }
    });

    // Triggered in the login modal to close it
    $scope.closeLogin = function () {
        $scope.modal.hide();
    };

    // Open the login modal
    $scope.login = function () {
        $scope.modal.show();
    };

    // Perform the login action when the user submits the login form
    $scope.doLogin = function () {
        var root = $scope.loginData.url;
        root = root.replace(/\/?$/, '/');

        authService
            .getApiUrl(root)
            .then(function (response) {
                var apiUrl = root + response.data.response.url;
                window.localStorage.setItem('apiUrl', apiUrl);

                return authService.loginUser(
                    $scope.loginData.email,
                    $scope.loginData.password,
                    apiUrl)
            })
            .then(function (response) {
                var token = response.data.response.token;
                window.localStorage.setItem('token', token);

                // We are logged in - close the login modal
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
    $scope.apiUrl = window.localStorage.getItem('apiUrl');
    $scope.token = window.localStorage.getItem('token');

    var init = function () {
        dataService
            .getCases($scope.filter, $scope.apiUrl, $scope.token)
            .then(function (response) {
                $scope.cases = response.data.response.cases.case;
            });
    };

    init();
})

.controller('CaseCtrl', function ($scope, $stateParams) {
    $scope.case = { title: 'This is the big massive title of the case that we are reviewing if we can do this with', id: 4 };
});
