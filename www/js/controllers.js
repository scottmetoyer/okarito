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
})

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

.controller('CasesCtrl', function($q, $filter, $rootScope, $state, $scope, $ionicLoading, $ionicScrollDelegate, $ionicSideMenuDelegate, $ionicModal, dataService, userService, caseModalService) {
  $scope.filter = '';
  $scope.filterDescription = '';
  $scope.ready = false;
  $scope.max = 25;
  $rootScope.attachments = [];

  $scope.newModal = function() {
    caseModalService
      .init('templates/edit.html', $scope)
      .then(function(modal) {
        modal.show();
      });
  };

  $scope.newCase = function() {
    $scope.label = 'New case';
    $scope.date = $filter('date')(new Date(), 'medium');
    $scope.touched = 'Opened by ' + userService.getCurrentUser().full_name;
    $rootScope.attachments = [];
    $scope.case = dataService.stubCase();
    $scope.newModal();
  }

  $scope.save = function() {
    dataService.saveCase($scope.case, 'new', $rootScope.attachments)
      .then(function(result) {
        // Clear the sub objects
        $rootScope.attachments = [];

        // Received customer feedback to go back to filter view after creating a case - testing this out
        $ionicLoading.show({
          template: '<ion-spinner class="overlay" icon="lines"></ion-spinner>'
        });

        loadCases();

        $scope.closeModal();
      });
  };

  $scope.doRefresh = function() {
    loadCases();
  };

  $scope.cancel = function() {
    $scope.closeModal();
  };

  $scope.showAll = function() {
    $scope.max = 99999;

    $ionicLoading.show({
      template: '<ion-spinner class="overlay" icon="lines"></ion-spinner>'
    });

    loadCases();
  };

  $scope.$on('$ionicView.loaded', function() {
    $ionicLoading.show({
      template: '<ion-spinner class="overlay" icon="lines"></ion-spinner>'
    });

    loadCases();
  });

  $scope.$on('set-filter', function(event, args) {
    $ionicLoading.show({
      template: '<ion-spinner class="overlay" icon="lines"></ion-spinner>'
    });

    $scope.max = 25;
    dataService
      .setFilter(args.filter)
      .then(function(response) {
        // Clear custom search and refresh the case list
        $scope.filter = '';
        loadCases();
      });

    $ionicScrollDelegate.scrollTop();
  });

  $scope.$on('search-cases', function(event, args) {
    $ionicLoading.show({
      template: '<ion-spinner class="overlay" icon="lines"></ion-spinner>'
    });

    $scope.max = 25;
    $ionicScrollDelegate.scrollTop();
    $scope.filter = args.search;
    loadCases().then(function() {
      // If there is only one case in the cases list, just open it
      if ($scope.cases.length == 1) {
        $state.go('app.single', {
          id: 0
        });
      }
    });
    $ionicSideMenuDelegate.toggleLeft(false);
  });

  $scope.$on('error', function(event, args) {
    $ionicLoading.hide();
    $scope.ready = true;

    var alertPopup = $ionicPopup.alert({
      title: 'FogBugz Error',
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

  var loadCases = function() {
    // Load the related entity lists
    return $q.all([
        dataService.getProjects(false),
        dataService.getPriorities(false),
        dataService.getPeople(false),
        dataService.getCategories(false),
        dataService.getStatuses(null, false, false)
      ])
      .then(function(responses) {
        $rootScope.projects = responses[0];
        $rootScope.priorities = responses[1];
        $rootScope.people = responses[2];
        $rootScope.categories = responses[3];
        $rootScope.allStatuses = responses[4];

        return dataService.getCases($scope.filter, false, $scope.max);
      })
      .then(function(response) {
        $scope.cases = response.cases;
        $scope.filterDescription = response.description;
        $scope.count = response.count;

        // Hide loaders
        $ionicLoading.hide();
        $scope.$broadcast('scroll.refreshComplete');
        $scope.ready = true;
      });
  }
});
