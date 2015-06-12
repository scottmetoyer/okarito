// Shared service utility functions
function transform(data) {
  var x2js = new X2JS();
  var json = x2js.xml_str2json(data);
  return json.response;
}

function normalizeArray(data) {
  var x2js = new X2JS();
  var array = x2js.asArray(data);
  if (array[0] == undefined) {
    return [];
  } else {
    return array;
  }
}

function getCategoryIcon(categoryId) {
  var icon = '';

  switch (categoryId) {
    case '1':
      icon = 'bug'
      break;

    case '2':
      icon = 'lightbulb'
      break;

    case '3':
      icon = 'email'
      break;

    case '4':
      icon = 'clock'
      break;

    case '5':
      icon = 'alert'
      break;

    case '6':
      icon = 'wrench'
      break;

    case '7':
      icon = 'search'
      break;

    case '8':
      icon = 'key'
      break;

    case '9':
      icon = 'alert-circled'
      break;

    default:
      icon = 'document-text'
      break;
  }

  return icon;
}

angular.module('okarito.services', ['angular-storage'])

.factory('userService', function(store) {
  var currentUser = {};

  return {
    setCurrentUser: function(user) {
      currentUser = user;
      store.set('user', user);
      return currentUser;
    },
    getCurrentUser: function() {
      currentUser = store.get('user');
      return currentUser;
    }
  }
})

.factory('dataService', function($q, $http, $filter, userService) {;
  var data = this;
  var cases = [];
  var categories = [];

  function getImageData(imgUrl) {
    var deferred = $q.defer();
    var promise = deferred.promise;

    window.resolveLocalFileSystemURL(
      imgUrl,
      function(fileEntry) {
        fileEntry.file(function(file) {
            var reader = new FileReader();
            reader.onloadend = function(e) {
              var imgBlob = new Blob([this.result], {
                type: file.type
              });

              // Add appropriate extension to the file name if it does not exist - Android media library bug
              // image/jpeg
              // image/png

              if (file.type == 'image/jpeg' && !(fileEntry.name.toLowerCase().endsWith('.jpg') || fileEntry.name.toLowerCase().endsWith('.jpeg'))) {
                fileEntry.name += '.jpg';
              }

              if (file.type == 'image/png' && ! fileEntry.name.toLowerCase().endsWith('.png')) {
                fileEntry.name += '.png';
              }

              deferred.resolve({ blob: imgBlob, name: fileEntry.name });
            };

            reader.readAsArrayBuffer(file);
          },
          function(e) {
            deferred.reject(e);
          });
      },
      function(e) {
        deferred.reject(e);
      });

    promise.success = function(fn) {
      promise.then(fn);
      return promise;
    }

    promise.error = function(fn) {
      promise.then(null, fn);
      return promise;
    }

    return promise;
  }

  return {
    getFilters: function() {
      return $http.get('cmd=listFilters', {
        transformResponse: transform
      }).then(function(response) {
        var filters = normalizeArray(response.data.filters.filter);
        return filters;
      });
    },
    getCase: function(id, refresh) {
      var bug = null;
      bug = cases[id];

      if (bug != null) {
        bug.newEvent = '';
        bug.tagList = normalizeArray(bug.tags.tag);

        for (var i = 0; i < bug.events.event.length; i++) {
          bug.events.event[i].attachments = normalizeArray(bug.events.event[i].rgAttachments.attachment);
        }
      }

      return bug;
    },
    getProjects: function(cacheResponse) {
      return $http.get('cmd=listProjects', {
        transformResponse: transform,
        cache: cacheResponse
      }).then(function(response) {
        var projects = normalizeArray(response.data.projects.project);
        var list = [];

        for (var i = 0; i < projects.length; i++) {
          list.push({
            id: projects[i].ixProject,
            text: projects[i].sProject.__cdata,
            checked: false,
            icon: null
          });
        };
        return list;
      });
    },
    getMailboxes: function() {
      return $http.get('cmd=listMailboxes', {
        transformResponse: transform
      }).then(function(response) {
        var mailboxes = normalizeArray(response.data.mailboxes.mailbox);
        var list = []

        for (var i = 0; i < mailboxes.length; i++) {
          list.push({
            id: mailboxes[i].ixMailbox,
            text: mailboxes[i].sEmail.__cdata,
            checked: false,
            icon: null
          });
        };
        return list;
      });
    },
    getPriorities: function(cacheResponse) {
      return $http.get('cmd=listPriorities', {
        transformResponse: transform,
        cache: cacheResponse
      }).then(function(response) {
        var priorities = normalizeArray(response.data.priorities.priority);
        var list = [];

        for (var i = 0; i < priorities.length; i++) {
          list.push({
            id: priorities[i].ixPriority,
            text: priorities[i].sPriority.__cdata,
            checked: false,
            icon: null
          });
        };
        return list;
      });
    },
    getStatuses: function(categoryId, resolved, cacheResponse) {
      var query = 'cmd=listStatuses';

      if (categoryId != null) {
        query += '&ixCategory=' + categoryId;
      }

      if (resolved != null && resolved == true) {
        query += '&fResolved=1'
      }

      return $http.get(query, {
        transformResponse: transform,
        cache: cacheResponse
      }).then(function(response) {
        var statuses = normalizeArray(response.data.statuses.status);
        var list = [];

        for (var i = 0; i < statuses.length; i++) {
          list.push({
            id: statuses[i].ixStatus,
            text: statuses[i].sStatus.__cdata,
            checked: false,
            icon: null,
            resolved: statuses[i].fResolved
          });
        };
        return list;
      });
    },
    getPeople: function(cacheResponse) {
      return $http.get('cmd=listPeople', {
        transformResponse: transform,
        cache: cacheResponse
      }).then(function(response) {
        var people = normalizeArray(response.data.people.person);
        var list = [];

        for (var i = 0; i < people.length; i++) {
          list.push({
            id: people[i].ixPerson,
            text: people[i].sFullName.__cdata,
            checked: false,
            icon: null,
            email: people[i].sEmail.__cdata
          });
        };
        return list;
      });
    },
    getCategories: function(cacheResponse) {
      return $http.get('cmd=listCategories', {
        transformResponse: transform,
        cache: cacheResponse
      }).then(function(response) {
        var categoryList = normalizeArray(response.data.categories.category);
        categories = [];

        for (var i = 0; i < categoryList.length; i++) {
          var icon = getCategoryIcon(categoryList[i].nIconType);
          var iconImage = 'ion-' + icon;

          categories.push({
            id: categoryList[i].ixCategory,
            text: categoryList[i].sCategory.__cdata,
            checked: false,
            iconType: categoryList[i].nIconType,
            icon: iconImage
          });
        };
        return categories;
      });
    },
    getAreas: function(projectId, cacheResponse) {
      return $http.get('cmd=listAreas&ixProject=' + projectId, {
        transformResponse: transform,
        cache: cacheResponse
      }).then(function(response) {
        var areas = normalizeArray(response.data.areas.area);
        var list = [];

        for (var i = 0; i < areas.length; i++) {
          list.push({
            id: areas[i].ixArea,
            text: areas[i].sArea.__cdata,
            checked: false,
            icon: null
          });
        };
        return list;
      });
    },
    getMilestones: function(projectId, cacheResponse) {
      return $http.get('cmd=listFixFors&ixProject=' + projectId, {
        transformResponse: transform,
        cache: cacheResponse
      }).then(function(response) {
        var milestones = normalizeArray(response.data.fixfors.fixfor);
        var list = [];

        for (var i = 0; i < milestones.length; i++) {
          list.push({
            id: milestones[i].ixFixFor,
            text: milestones[i].sFixFor.__cdata,
            checked: false,
            icon: null
          });
        };
        return list;
      });
    },
    refreshCase: function(caseId) {
      return $http.get('cmd=search&q=' + caseId + '&cols=sTitle,ixBug,fOpen,sFormat,sProject,ixProject,sArea,ixArea,sPriority,ixPriority,sFixFor,ixFixFor,ixStatus,sStatus,sCategory,ixCategory,sPersonAssignedTo,ixPersonAssignedTo,sEmailAssignedTo,tags,events', {
        transformResponse: transform
      }).then(function(response) {
        var bug = normalizeArray(response.data.cases.case)[0];
        bug.newEvent = '';
        bug.tagList = normalizeArray(bug.tags.tag);

        var category = $filter('filter')(categories, {
          id: bug.ixCategory
        }, true)[0];
        bug.icon = category.icon;

        for (var i = 0; i < bug.events.event.length; i++) {
          bug.events.event[i].attachments = normalizeArray(bug.events.event[i].rgAttachments.attachment);
        }

        // Copy refreshed case back in to the case list
        for (var i = 0; i < cases.length; i++) {
          if (cases[i].ixBug == caseId) {
            angular.copy(bug, cases[i]);
          }
        }
      });
    },
    getCases: function(filter, cacheResponse, max) {
      return $http.get('cmd=search&q=' + filter + '&cols=sTitle,ixBug,fOpen,sFormat,sProject,ixProject,sArea,ixArea,sPriority,ixPriority,sFixFor,ixFixFor,ixStatus,sStatus,sCategory,ixCategory,sPersonAssignedTo,ixPersonAssignedTo,sEmailAssignedTo,tags,events', {
        transformResponse: transform,
        cache: cacheResponse
      }).then(function(response) {
        var description = response.data.description != undefined ? response.data.description.__cdata : 'Search: ' + filter;
        cases = normalizeArray(response.data.cases.case).splice(0, max);
        count = response.data.cases._count;

        // Loop through the cases and set the case icon
        for (var i = 0; i < cases.length; i++) {
          var category = $filter('filter')(categories, {
            id: cases[i].ixCategory
          }, true)[0];
          cases[i].icon = category.icon;
        }

        return {
          cases: cases,
          description: description,
          count: count
        };
      });
    },
    setFilter: function(filterId) {
      return $http.get('cmd=setCurrentFilter&sFilter=' + filterId);
    },
    stubCase: function() {
      return {
        ixProject: 0,
        ixArea: 0,
        ixFixFor: 0,
        ixCategory: 0,
        ixPersonAssignedTo: 0,
        ixPriority: 0,
        sProject: {
          __cdata: ''
        },
        sArea: {
          __cdata: ''
        },
        sFixFor: {
          __cdata: ''
        },
        sCategory: {
          __cdata: ''
        },
        sPersonAssignedTo: {
          __cdata: ''
        },
        sPriority: {
          __cdata: ''
        },
        sStatus: {
          __cdata: ''
        },
        sTitle: {
          __cdata: ''
        },
        newEvent: ''
      };
    },
    assignCase: function(bug) {
      var fd = new FormData();
      fd.append('cmd', 'assign');
      fd.append('ixBug', bug.ixBug);
      fd.append('ixPersonAssignedTo', bug.ixPersonAssignedTo);

      return $http({
        method: 'POST',
        url: '',
        data: fd,
        headers: {
          'Content-Type': undefined
        },
        transformResponse: transform,
        transformRequest: angular.identity
      }).then(function(response) {
        // Save success
        return response;
      });
    },
    closeCase: function(bug, attachments) {
      var fd = new FormData();
      fd.append('cmd', 'close');
      fd.append('ixBug', bug.ixBug);
      fd.append('sEvent', bug.newEvent);

      return $http({
        method: 'POST',
        url: '',
        data: fd,
        headers: {
          'Content-Type': undefined
        },
        transformResponse: transform,
        transformRequest: angular.identity
      }).then(function(response) {
        return response;
      });
    },
    emailCase: function(bug, mail, attachments) {
      var fd = new FormData();
      fd.append('cmd', 'email');
      fd.append('ixBug', bug.ixBug);
      fd.append('sFrom', mail.from);
      fd.append('sTo', mail.to);
      fd.append('sSubject', mail.subject);
      fd.append('sCC', mail.cc);
      fd.append('sBCC', mail.bcc);
      fd.append('sEvent', bug.newEvent);

      return $http({
        method: 'POST',
        url: '',
        data: fd,
        headers: {
          'Content-Type': undefined
        },
        transformResponse: transform,
        transformRequest: angular.identity
      }).then(function(response) {
        return response;
      });
    },
    saveCase: function(bug, cmd, attachments) {
      var fd = new FormData();
      fd.append('cmd', cmd);

      if (cmd == 'resolve') {
        fd.append('ixStatus', bug.ixStatus);
      }

      // Create comma separated list of tags
      var tags = '';
      for (var i = 0; i < bug.tagList.length; i++) {
        tags += ',"' + bug.tagList[i].__cdata + '"';
      }
      tags = tags.substring(1);
      if (tags == '') {
        tags = ",";
      }
      fd.append('sTags', tags);

      fd.append('ixBug', bug.ixBug);
      fd.append('sTitle', bug.sTitle.__cdata);
      fd.append('ixArea', bug.ixArea);
      fd.append('ixProject', bug.ixProject);
      fd.append('ixPriority', bug.ixPriority);
      fd.append('ixCategory', bug.ixCategory);
      fd.append('ixFixFor', bug.ixFixFor);
      fd.append('ixPersonAssignedTo', bug.ixPersonAssignedTo);
      fd.append('sEvent', bug.newEvent);;

      if (attachments.length > 0) {
        var promises = [];

        for (var i = 0; i < attachments.length; i++) {
          promises.push(getImageData(attachments[i].url));
        }

        return $q.all(promises).then(function(responses) {
          fd.append('nFileCount', responses.length);

          for (var i = 0; i < responses.length; i++) {
            fd.append('File' + (i + 1), responses[i].blob, responses[i].name);
          }

          return $http.post('', fd, { headers: {'Content-Type': undefined },
              transformResponse: transform,
              transformRequest: angular.identity
          }).then(function(response) {
              return response;
          });
        });
      } else {
        return $http.post('', fd, { headers: {'Content-Type': undefined },
            transformResponse: transform,
            transformRequest: angular.identity
          }).then(function(response) {
            return response;
          });
      }
    }
  }
})

.service('caseModalService', function($q, $ionicModal, $rootScope, dataService) {
  var init = function(tpl, $scope) {
    var promise;
    $scope = $scope || $rootScope.$new();

    promise = $ionicModal.fromTemplateUrl(tpl, {
      scope: $scope,
      animation: 'slide-in-up'
    }).then(function(modal) {
      $scope.modal = modal;
      return modal;
    });

    $scope.openModal = function() {
      $scope.modal.show();
    };

    $scope.closeModal = function() {
      $scope.modal.hide();
    };

    $scope.projectUpdated = function(val) {
      $scope.case.ixProject = val;

      $q.all([
          dataService.getMilestones(val, false),
          dataService.getAreas(val, false)
        ])
        .then(function(responses) {
          $scope.milestones = responses[0];
          $scope.areas = responses[1];
          $scope.case.sFixFor.__cdata = $scope.milestones[0].text;
          $scope.case.ixFixFor = $scope.milestones[0].id;
          $scope.case.sArea.__cdata = $scope.areas[0].text;
          $scope.case.ixArea = $scope.areas[0].id;
        });
    }

    $scope.categoryUpdated = function(val, resolved) {
      $scope.case.ixCategory = val;
      dataService.getStatuses(val, resolved, false)
        .then(function(response) {
          $scope.statuses = response;
          $scope.case.sStatus.__cdata = $scope.statuses[0].text; // TODO: Find the bug here, when saving a new case
          $scope.case.ixStatus = $scope.statuses[0].id;
        });
    }

    $scope.$on('$destroy', function() {
      $scope.modal.remove();
    });

    return promise;
  }

  return {
    init: init
  }
})

.service('loginService', function($q, $http) {
  return {
    loginUser: function(userEmail, password, root) {
      var deferred = $q.defer();
      var promise = deferred.promise;
      var user = {
        email: userEmail,
        api_url: '',
        access_token: '',
        full_name: '',
        root: ''
      };

      // Fix up the FogBugz root URL input - add a trailing slash if not present
      root = root.replace(/\/?$/, '/');

      // Prepend with https if the user did not specify a protocol
      /*
      if (!/^https?:\/\//i.test(root)) {
          root = 'https://' + root;
      }
      */

      $http
        .get(root + 'api.xml', {
          transformResponse: transform
        })
        .then(function(response) {
          // Retrive the FogBugz API url
          user.api_url = root + response.data.url;
          user.root = root;

          return $http.get(user.api_url + 'cmd=logon&email=' + userEmail + '&password=' + password, {
              transformResponse: transform
            })
            .then(function(response) {
              user.access_token = response.data.token.__cdata;
              deferred.resolve(user);
            });
        })
        .catch(function(reject) {
          if (reject.status != 200) {
            deferred.reject(reject);
          }
        })

      promise.success = function(fn) {
        promise.then(fn);
        return promise;
      }

      promise.error = function(fn) {
        promise.then(null, fn);
        return promise;
      }

      return promise;
    }
  }
})

.factory('cameraService', ['$q', function($q) {

  return {
    getPicture: function(options) {
      var q = $q.defer();

      navigator.camera.getPicture(function(result) {
        q.resolve(result);
      }, function(err) {
        q.reject(err);
      }, options);

      return q.promise;
    }
  }
}])

.filter('hrefToJS', function($sce, $sanitize) {
  return function(text) {
    var regex = /href="([\S]+)"/g;
    var newString = $sanitize(text).replace(regex, "onClick=\"window.open('$1', '_system', 'location=yes')\"");
    return $sce.trustAsHtml(newString);
  }
})

.service('authInterceptor', function($q, $rootScope, userService) {
  var service = this;

  service.request = function(config) {
    var currentUser = userService.getCurrentUser();
    var access_token = currentUser ? currentUser.access_token : null;
    var api_url = currentUser ? currentUser.api_url : null;

    // Process GET requests
    if (config.method == 'GET') {
      // If the request is a FogBugz command and we have a token save, append it
      if (config.url.indexOf('cmd=') > -1 && config.url.indexOf('cmd=logon') == -1) {
        if (access_token && api_url) {
          config.url = api_url + config.url + '&token=' + access_token;
        } else {
          $rootScope.$broadcast('not-logged-in');
        }
      }
    }

    // Process POST requests
    if (config.method == 'POST') {
      if (access_token && api_url) {
        config.url = api_url + config.url;
        config.data.append('token', access_token);
      } else {
        $rootScope.$broadcast('not-logged-in');
      }
    }

    return config || $q.when(config);
  };

  service.response = function(response) {
    if (response.data && response.data.error) {
      var code = response.data.error._code;
      console.log(response);

      switch (code) {
        case '1':
          $rootScope.$broadcast('unauthorized', {
            message: response.data.error.__cdata
          });
          break;
        case '2':
          var peopleList = normalizeArray(response.data.people.person);
          $rootScope.$broadcast('ambiguous-login', {
            people: peopleList
          });
          break;
        case '3':
          $rootScope.$broadcast('not-logged-in');
          break;
        default:
          $rootScope.$broadcast('error', {
            message: response.data.error.__cdata
          });
          break;
      };

      return $q.reject(response);
    }
    return response;
  };

  service.responseError = function(rejection) {
    console.log(rejection);
    return $q.reject(rejection);
  };
});
