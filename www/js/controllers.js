angular.module('okarito.controllers', ['okarito.services'])

.controller('AppCtrl', function($scope, $rootScope, $state, $filter, $ionicLoading, $ionicPopup, $ionicModal, $timeout, loginService, userService, dataService, cameraService) {
  var app = this;
  $scope.s = {
    searchString: ''
  };
  $rootScope.attachments = [];

  $rootScope.deleteAttachment = function(idx) {
    $rootScope.attachments.splice(idx, 1);
  }

  $rootScope.camera = function() {
    var options = {
      quality: 75,
      destinationType: Camera.DestinationType.FILE_URI,
      sourceType: Camera.PictureSourceType.CAMERA,
      allowEdit: false,
      encodingType: Camera.EncodingType.JPEG
    };

    cameraService.getPicture(options).then(function(imageURI) {
      var filename = imageURI.substr(imageURI.lastIndexOf("/") + 1);
      var attachment = {
        name: filename,
        url: imageURI
      };
      $rootScope.attachments.push(attachment);
    }, function(err) {
      // TODO: Handle camera error
    });
  };

  $rootScope.viewAttachment = function(url) {
    var root = userService.getCurrentUser().root;
    var token = userService.getCurrentUser().access_token;
    var url = angular.element('<textarea />').html(url).text();

    var link = root + url + '&token=' + token;
    window.open(link, '_system', 'location=no,EnableViewPortScale=yes');
  };

  $rootScope.showAttachment = function(imageSrc) {
    // Turn off attachment view until we fix the bugs
    /*
    var scope = $scope.$new(true);

    window.resolveLocalFileSystemURL(
      imageSrc,
      function(fileEntry) {
        fileEntry.file(function(file) {
          if (file.type == 'image/jpeg' && !(fileEntry.name.toLowerCase().endsWith('.jpg') || fileEntry.name.toLowerCase().endsWith('.jpeg'))) {
            fileEntry.name += '.jpg';
          }

          if (file.type == 'image/png' && !fileEntry.name.toLowerCase().endsWith('.png')) {
            fileEntry.name += '.png';
          }

          scope.imageSrc = fileEntry.nativeURL;

          $ionicModal.fromTemplateUrl('templates/image-modal.html', {
            scope: scope,
            animation: 'slide-in-up'
          }).then(function(modal) {
            scope.modal = modal;
            scope.modal.show();
          });

          scope.hideAttachments = function() {
            scope.modal.hide();
          };

          scope.$on('$destroy', function() {
            scope.modal.remove();
          });
        },
        function(e){
          console.log(e);
        });
      },
      function(e) {
        console.log(e);
      });
      */
  };

  $rootScope.gallery = function() {
    var options = {
      quality: 75,
      destinationType: Camera.DestinationType.FILE_URI,
      sourceType: Camera.PictureSourceType.PHOTOLIBRARY,
      allowEdit: false,
      encodingType: Camera.EncodingType.JPEG
    };

    cameraService.getPicture(options).then(function(imageURI) {
      var filename = imageURI.substr(imageURI.lastIndexOf("/") + 1);
      var attachment = {
        name: filename,
        url: imageURI
      };
      $rootScope.attachments.push(attachment);
    }, function(err) {
      // TODO: Handle gallery error
    })
  };

  $rootScope.$on('not-logged-in', function(event, args) {
    $ionicLoading.hide();

    if (args != undefined && args.message != undefined) {
      var alertPopup = $ionicPopup.alert({
        title: 'Not logged in',
        template: args.message,
        buttons: [{
          text: 'OK',
          type: 'button-stable',
          onTap: function(e) {
            return;
          }
        }]
      });
    }
    $state.go('login');
  });

  $rootScope.$on('unauthorized', function(event, args) {
    $ionicLoading.hide();

    var alertPopup = $ionicPopup.alert({
      title: 'Authentication error',
      template: args.message,
      buttons: [{
        text: 'OK',
        type: 'button-stable',
        onTap: function(e) {
          return;
        }
      }]
    });

    $state.go('login');
  });

  $rootScope.$on('request-error', function(event, args) {
    $ionicLoading.hide();

    var alertPopup = $ionicPopup.alert({
      title: 'Request error',
      template: args.message,
      buttons: [{
        text: 'OK',
        type: 'button-stable',
        onTap: function(e) {
          return;
        }
      }]
    });
  });

  $rootScope.$on('authorized', function() {
    app.currentUser = userService.getCurrentUser();
  });

  $scope.$on('$ionicView.enter', function() {
    init();
  });

  $scope.logout = function() {
    userService.setCurrentUser(null);
    $state.go('login');
  };

  $scope.setFilter = function(filterId) {
    $rootScope.$broadcast('set-filter', {
      filter: filterId
    });
  };

  $scope.search = function() {
    var s = $scope.s.searchString;
    $rootScope.$broadcast('search-cases', {
      search: s
    });

    // Clear the search box
    $scope.s.searchString = '';
  };

  var init = function() {
    dataService
      .getFilters()
      .then(function(response) {
        $scope.builtinFilters = $filter('filter')(response, {
          _type: 'builtin'
        }, true);
        $scope.savedFilters = $filter('filter')(response, {
          _type: 'saved'
        }, true);
        $scope.sharedFilters = $filter('filter')(response, {
          _type: 'shared'
        }, true);
      });

    $scope.currentUser = userService.getCurrentUser();
  };
});
