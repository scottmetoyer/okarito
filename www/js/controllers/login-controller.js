angular.module('okarito.controllers')

.controller('LoginCtrl', function($scope, $rootScope, $state, $filter, $ionicPopup, $ionicModal, loginService, userService, dataService) {
  $scope.data = {
    token: '',
    url: ''
  };

  $scope.prependHttps = function() {
      if ($scope.data.url == '') {
        $scope.data.url = "https://";
      }
  };

  $scope.login = function() {
    loginUser($scope.data.token, $scope.data.url);
  };

  $scope.showUrlHelp = function() {
    var alertPopup = $ionicPopup.alert({
      title: 'What is my FogBugz URL?',
      template: '<p>Your FogBug URL is the root web address of your FogBugz installation.</p><p>For On-Demand accounts, it will look something like this:</p><p><strong>https://yourusername.fogbugz.com</strong></p><p>Browse to your FogBugz installation and check the address bar to find your FogBugz URL.</p>',
      buttons: [{
        text: 'OK',
        type: 'button-stable',
        onTap: function(e) {
          return;
        }
      }]
    });
  };

  function loginUser(token, url) {
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

        // Clear out the password value
        $scope.data.password = '';

        $rootScope.$broadcast('authorized');
        $state.go('app.cases').then(function() {
          $rootScope.$broadcast('search-cases', {
            search: ''
          });
        });
      })
      .error(function(data) {
        var alertPopup = $ionicPopup.alert({
          title: 'Error connecting to FogBugz',
          template: 'Please check your FogBugz URL and try again',
          buttons: [{
            text: 'OK',
            type: 'button-stable',
            onTap: function(e) {
              return;
            }
          }]
        });
      });
  }
})
