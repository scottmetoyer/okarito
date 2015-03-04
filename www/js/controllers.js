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
        var properties = authService.getProperties();
        if (properties == null) {
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
        var properties = {};
        var root = $scope.loginData.url;
        root = root.replace(/\/?$/, '/');

        authService
            .getApiUrl(root)
            .then(function (response) {
                var apiUrl = root + response.data.response.url.__cdata;
                properties.apiUrl = apiUrl;

                return authService.loginUser(
                    $scope.loginData.email,
                    $scope.loginData.password,
                    apiUrl)
            })
            .then(function (response) {
                var token = response.data.response.token.__cdata;
                properties.token = token;
                
                // Persist the token and apiUrl
                authService.setProperties(properties);

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
        dataService
            .getCase($stateParams.caseId)
            .then(function (response) {
                $scope.case = response.data.response.cases.case[0];
            })
            .catch(function (response) {
                alert("Error loading case");
            });;
    }

    init();
});
