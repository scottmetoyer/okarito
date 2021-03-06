angular.module('okarito.controllers')

.controller('CaseCtrl', function($q, $scope, $state, $sce, $rootScope, $stateParams, $timeout, $ionicModal, $ionicPopover, $ionicPopup, $filter, $ionicLoading, dataService, userService, caseModalService) {
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

  $scope.quickSearch = function(searchString) {
    $state.go('app.cases').then(function() {
      $rootScope.$broadcast('search-cases', {
        search: searchString
      });
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
    return caseModalService.init('templates/edit.html', $scope)
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
      dataService.emailCase($scope.case, $scope.mailMessage, $rootScope.attachments)
        .then(function(result) {
          dataService.refreshCase($scope.case.ixBug)
            .then(function() {
              $scope.working = false;
              $scope.mailMessage = {
                from: '',
                to: '',
                cc: '',
                bcc: '',
                subject: ''
              };
              $rootScope.attachments = [];
            });
        })
    } else {
      dataService.saveCase($scope.case, command, $rootScope.attachments)
        .then(function(result) {
          dataService.refreshCase($scope.case.ixBug)
            .then(function() {
              $scope.working = false;
              $scope.mailMessage = {
                from: '',
                to: '',
                cc: '',
                bcc: '',
                subject: ''
              };
              $rootScope.attachments = [];
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
    $rootScope.attachments = [];
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
    $scope.editModal().then(function() {
      prepareModal();
    });
  };

  $scope.openPopover = function($event) {
    $scope.popover.show($event);
  };

  $scope.closePopover = function() {
    $scope.popover.hide();
  };

  $scope.$on('$ionicView.enter', function() {});

  $scope.$on('$ionicView.beforeEnter', function() {
    $scope.ready = false;
    init();
  });

  var prepareModal = function() {
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
      });
  }

  var init = function() {
    $scope.case = dataService.previewCase($stateParams.id);

    dataService.getCase($stateParams.id).then(function(result) {
      $scope.case = result;
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
    });
  };
});
