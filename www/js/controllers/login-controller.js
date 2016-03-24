angular.module('okarito.controllers')

.controller('LoginCtrl', function($scope, $rootScope, $state, $filter, $ionicPopup, $ionicModal, loginService, userService, dataService) {
  $scope.data = {
    email: '',
    url: '',
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
      // Resend the login request, passing in the appropriate user full name
      loginUser(item.text, $scope.data.password, $scope.data.url, true);
      $scope.modal.hide();
    };
  });

  $scope.showEmailLogin = function() {
  };

  $scope.showTokenLogin = function() {
  };

  $scope.prependHttps = function() {
      if ($scope.data.url == '') {
        $scope.data.url = "https://";
      }
  };

  $scope.login = function() {
    loginUser($scope.data.email, $scope.data.password, $scope.data.url, false);
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
