angular.module('okarito.controllers', ['okarito.services'])

.controller('AppCtrl', function($scope, $rootScope, $state, $filter, $ionicLoading, $ionicPopup, $ionicModal, $timeout, loginService, userService, dataService) {
  var app = this;
  $scope.s = {
    searchString: ''
  };

  $rootScope.$on('not-logged-in', function(event) {
    $ionicLoading.hide();
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
    email: 'scott.metoyer@gmail.com',
    url: 'https://scottmetoyer.fogbugz.com',
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

        // TODO: Clear out scope data on successful login
        // $scope.data = {};
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
  $scope.attachments = [];

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
    $scope.case = dataService.stubCase();
    $scope.newModal();
  }

  $scope.save = function() {
    dataService.saveCase($scope.case, 'new')
      .then(function(result) {
        // Get the created case number and open it up
        caseNumber = result.data.case._ixBug;

        if (caseNumber != undefined) {
          $rootScope.$broadcast('search-cases', {
            search: caseNumber
          });
        }

        $scope.closeModal();
      });
  };

  $scope.doRefresh = function() {
    loadCases();
  };

  $scope.cancel = function() {
    $scope.attachments = [];
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
})

.controller('CaseCtrl', function($q, $scope, $state, $sce, $rootScope, $stateParams, $timeout, $ionicModal, $ionicPopover, $ionicPopup, $filter, $ionicLoading, dataService, userService, caseModalService, cameraService) {
  var x2js = new X2JS();
  var backup = {};
  $scope.working = false;
  $scope.caseResolved = false;
  $scope.mailMessage = {
    from: '',
    to: '',
    cc: '',
    bcc: '',
    subject: ''
  };
  $scope.attachments = [];

  $scope.$on('error', function(event, args) {
    $ionicLoading.hide();
    $scope.working = false;
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

    if (backup != {}) {
      angular.copy(backup, $scope.case);
    }
  });

  $ionicPopover.fromTemplateUrl('templates/more-actions.html', {
    scope: $scope,
  }).then(function(popover) {
    $scope.popover = popover;
  });

  $scope.deleteAttachment = function(idx) {
    $scope.attachments.splice(idx, 1);
  }

  $scope.quickSearch = function(searchString) {
    $state.go('app.cases').then(function() {
      $rootScope.$broadcast('search-cases', {
        search: searchString
      });
    });
  };

  $scope.viewAttachment = function(url) {
    var root = userService.getCurrentUser().root;
    var token = userService.getCurrentUser().access_token;
    var url = angular.element('<textarea />').html(url).text();

    var link = root + url + '&token=' + token;
    window.open(link, '_blank', 'location=no,EnableViewPortScale=yes');
  };

  $scope.showAttachment = function(imageSrc) {
    var scope = $scope.$new(true);
    scope.imageSrc = imageSrc;

    $ionicModal.fromTemplateUrl('templates/image-modal.html', {
      scope: scope,
      animation: 'slide-in-up'
    }).then(function(modal) {
      scope.modal = modal;
      scope.modal.show();
    });

    scope.hideAttachments = function() {
      scope.modal.hide();
    }

    scope.$on('$destroy', function() {
      scope.modal.remove();
    });
  };

  $scope.chooseEmail = function() {
    $scope.items = $scope.mailboxes;

    $ionicModal.fromTemplateUrl(
        'templates/mailboxes.html', {
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
      $scope.case.ixMailbox = item.id;
      $scope.mailMessage.to = item.text;
    };
  };

  $scope.editModal = function() {
    caseModalService.init('templates/edit.html', $scope)
      .then(function(modal) {
        modal.show();
      });
  };

  $scope.resolveModal = function() {
    caseModalService.init('templates/resolve.html', $scope)
      .then(function(modal) {
        modal.show();
      });
  };

  $scope.reopenModal = function() {
    caseModalService.init('templates/reopen.html', $scope)
      .then(function(modal) {
        modal.show();
      });
  };

  $scope.reactivateModal = function() {
    caseModalService.init('templates/reactivate.html', $scope)
      .then(function(modal) {
        modal.show();
      });
  };

  $scope.closeCaseModal = function() {
    caseModalService.init('templates/close.html', $scope)
      .then(function(modal) {
        modal.show();
      });
  };

  $scope.emailCaseModal = function() {
    caseModalService.init('templates/email.html', $scope)
      .then(function(modal) {
        modal.show();
      });
  };

  $scope.save = function(command) {
    $scope.working = true;
    $scope.closeModal();

    if (command == 'email') {
      dataService.emailCase($scope.case, $scope.mailMessage)
        .then(function(result) {
          dataService.refreshCase($scope.case.ixBug)
            .then(function() {
              $scope.working = false;
            });
        })
    } else {
      dataService.saveCase($scope.case, command, $scope.attachments)
        .then(function(result) {
          dataService.refreshCase($scope.case.ixBug)
            .then(function() {
              $scope.working = false;
            });
        });
    }
  };

  $scope.cancel = function() {
    $scope.mailMessage = {
      from: '',
      to: '',
      cc: '',
      bcc: '',
      subject: ''
    };
    $scope.attachments = [];
    angular.copy(backup, $scope.case);
    $scope.closeModal();
  };

  $scope.showAssign = function(e) {
    $scope.closePopover();
    $scope.showItems(e);
  };

  $scope.refreshCase = function() {
    $scope.working = true;
    $scope.closePopover();

    dataService.refreshCase($scope.case.ixBug)
      .then(function() {
        $scope.working = false;
      });
  };

  $scope.camera = function() {
    var options = {
      quality: 75,
      destinationType: Camera.DestinationType.FILE_URI,
      sourceType: Camera.PictureSourceType.CAMERA,
      allowEdit: false,
      encodingType: Camera.EncodingType.JPEG
    };

    cameraService.getPicture(options).then(function(imageURI) {
      console.log(imageURI);
    }, function(err) {
      console.log(err);
    });
  };

  $scope.gallery = function() {
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
      $scope.attachments.push(attachment);
    }, function(err) {
      console.log(err);

      // TODO: Show an Ionic popup error
    });
  };

  $scope.emailCase = function() {
    $scope.label = 'Email Case ' + $scope.case.ixBug;
    $scope.touched = 'Emailed by ' + userService.getCurrentUser().full_name;

    $scope.closePopover();
    $scope.emailCaseModal();

    prepareModal().then(function() {
      $scope.case.ixMailbox = $scope.mailboxes[0].id;
      $scope.mailMessage.from = $scope.mailboxes[0].text;
      $scope.mailMessage.subject = "(Case " + $scope.case.ixBug + ") " + $scope.case.sTitle.__cdata;
    });
  };

  $scope.assignCase = function(val, text) {
    $scope.working = true;
    $scope.case.ixPersonAssignedTo = val;
    $scope.case.sPersonAssignedTo.__cdata = text;

    dataService.assignCase($scope.case)
      .then(function(result) {
        dataService.refreshCase($scope.case.ixBug)
          .then(function() {
            $scope.working = false;
          });
      });
  };

  $scope.resolveCase = function() {
    $scope.label = 'Resolve Case ' + $scope.case.ixBug;
    $scope.touched = 'Resolved by ' + userService.getCurrentUser().full_name;

    $scope.closePopover();
    $scope.resolveModal();

    prepareModal().then(function() {
      $scope.case.ixStatus = $scope.statuses[0].id;
      $scope.case.sStatus.__cdata = $scope.statuses[0].text;
    });
  };

  $scope.reactivateCase = function() {
    $scope.label = 'Reactivate Case ' + $scope.case.ixBug;
    $scope.touched = 'Reactivated by ' + userService.getCurrentUser().full_name;

    $scope.closePopover();
    $scope.reactivateModal();
    prepareModal().then(function() {});
  };

  $scope.reopenCase = function() {
    $scope.label = 'Reopen Case ' + $scope.case.ixBug;
    $scope.touched = 'Reopened by ' + userService.getCurrentUser().full_name;

    $scope.closePopover();
    $scope.reopenModal();
    prepareModal().then(function() {
      $scope.case.ixPersonAssignedTo = userService.getCurrentUser().user_id;
      $scope.case.sPersonAssignedTo.__cdata = userService.getCurrentUser().full_name;
    });
  };

  $scope.closeCase = function() {
    $scope.label = 'Close Case ' + $scope.case.ixBug;
    $scope.touched = 'Closed by ' + userService.getCurrentUser().full_name;

    angular.copy($scope.case, backup);
    $scope.closePopover();
    $scope.closeCaseModal();
  };

  $scope.editCase = function() {
    $scope.label = 'Edit Case ' + $scope.case.ixBug + ' (' + $scope.case.sStatus.__cdata + ')';
    $scope.touched = 'Edited by ' + userService.getCurrentUser().full_name;

    $scope.closePopover();
    $scope.editModal();
    prepareModal().then(function() {});
  };

  $scope.openPopover = function($event) {
    $scope.popover.show($event);
  };

  $scope.closePopover = function() {
    $scope.popover.hide();
  };

  $scope.$on('$ionicView.enter', function() {
    init();
  });

  $scope.$on('$ionicView.beforeEnter', function() {
    $scope.ready = false;
  });

  var prepareModal = function() {
    $ionicLoading.show({
      template: '<ion-spinner class="overlay" icon="lines"></ion-spinner>'
    });

    // Backup the case to support non-destructive edit
    angular.copy($scope.case, backup);

    return $q.all([
        dataService.getMilestones($scope.case.ixProject, false),
        dataService.getAreas($scope.case.ixProject, false),
        dataService.getStatuses($scope.case.ixCategory, true, false),
        dataService.getMailboxes()
      ])
      .then(function(responses) {
        $scope.milestones = responses[0];
        $scope.areas = responses[1];
        $scope.statuses = responses[2];
        $scope.mailboxes = responses[3];
        $ionicLoading.hide();
      });
  }

  var init = function() {
    $scope.case = dataService.getCase($stateParams.id);
    $scope.date = $filter('date')(new Date(), 'medium');

    $scope.$watch('case.ixCategory', function(newValue, oldValue) {
      var category = $filter('filter')($rootScope.categories, {
        id: $scope.case.ixCategory
      }, true)[0];

      $scope.case.icon = category.icon;
    });

    $scope.$watch('case.ixStatus', function(newValue, oldValue) {
      var status = $filter('filter')($rootScope.allStatuses, {
        id: $scope.case.ixStatus
      }, true)[0];

      $scope.caseResolved = status.resolved;
    });

    $scope.ready = true;
  };
});
