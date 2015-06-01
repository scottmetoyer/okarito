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

.factory('dataService', function($http, userService) {;
  var data = this;
  var cases = [];

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

      for (var i = 0; i < cases.length; i++) {
        if (cases[i].ixBug == id) {
          bug = cases[i];
          bug.newEvent = '';
          bug.tags = normalizeArray(bug.tags.tag);
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
        var categories = normalizeArray(response.data.categories.category);
        var list = [];

        for (var i = 0; i < categories.length; i++) {
          list.push({
            id: categories[i].ixCategory,
            text: categories[i].sCategory.__cdata,
            checked: false,
            icon: categories[i].nIconType
          });
        };
        return list;
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
        bug.tags = normalizeArray(bug.tags.tag);

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
        sTitle: {
          __cdata: ''
        },
        newEvent: ''
      };
    },
    assignCase: function(bug) {
      return $http({
        method: 'POST',
        url: '',
        data: "cmd=assign&ixBug=" + bug.ixBug +
          "&ixPersonAssignedTo=" + bug.ixPersonAssignedTo,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        transformResponse: transform
      }).then(function(response) {
        // Save success
        return response;
      });
    },
    closeCase: function(bug) {
      return $http({
        method: 'POST',
        url: '',
        data: "cmd=close&ixBug=" + bug.ixBug +
          "&sEvent=" + bug.newEvent,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        transformResponse: transform
      }).then(function(response) {
        return response;
      });
    },
    saveCase: function(bug, cmd) {
      var status = '';
      if (cmd == 'resolve') {
        status = "&ixStatus=" + bug.ixStatus;
      }

      // Create comma separated list of tags
      var tags = '';
      for (var i = 0; i < bug.tags.length; i++) {
        tags += ',"' + bug.tags[i].__cdata + '"';
      }
      tags = tags.substring(1);
      if (tags == '') {
        tags = ",";
      }

      return $http({
        method: 'POST',
        url: '',
        data: "cmd=" + cmd + "&ixBug=" + bug.ixBug +
          "&sTitle=" + bug.sTitle.__cdata +
          "&ixArea=" + bug.ixArea +
          "&ixProject=" + bug.ixProject +
          "&ixPriority=" + bug.ixPriority +
          "&ixCategory=" + bug.ixCategory +
          "&ixFixFor=" + bug.ixFixFor +
          "&ixPersonAssignedTo=" + bug.ixPersonAssignedTo +
          "&sEvent=" + bug.newEvent +
          "&sTags=" + tags +
          status,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        transformResponse: transform
      }).then(function(response) {
        return response;
      });
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
          $scope.case.sStatus.__cdata = $scope.statuses[0].text;
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
        full_name: ''
      };

      root = root.replace(/\/?$/, '/');

      $http
        .get(root + 'api.xml', {
          transformResponse: transform
        })
        .then(function(response) {
          // Retrive the FogBugz API url
          user.api_url = root + response.data.url;
          return $http.get(user.api_url + 'cmd=logon&email=' + userEmail + '&password=' + password, {
            transformResponse: transform
          });
        })
        .then(function(response) {
          user.access_token = response.data.token.__cdata;
          deferred.resolve(user);
        })
        .catch(function(error) {
          deferred.reject('Unable to connect to FogBugz. Please check your entries and try again.');
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
  }
})

.factory("utilityService", function() {
  return {
    categoryIcon: function(categoryId) {
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
  }
})

.factory('cameraService', ['$q', function($q) {

  return {
    getPicture: function(options) {
      var q = $q.defer();

      navigator.camera.getPicture(function(result) {
        // Do any magic you need
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
          $rootScope.$broadcast('unauthorized', {
            message: 'Please log in to FogBugz to continue'
          });
        }
      }
    }

    // Process POST requests
    if (config.method == 'POST') {
      if (config.data.indexOf('cmd=') > -1) {
        if (access_token && api_url) {
          config.url = api_url + config.url;
          config.data = config.data + "&token=" + access_token;
        } else {
          $rootScope.$broadcast('unauthorized', {
            message: 'Please log in to FogBugz to continue'
          });
        }
      }
    }

    return config;
  };

  service.response = function(response) {
    if (response.data && response.data.error) {
      console.log(response.data.error);
      var code = response.data.error._code;

      switch (code) {
        case '0':
          $rootScope.$broadcast('error', {
            message: 'FogBugz not initialized. Database may be down or needs to be upgraded.'
          });
          break;
        case '1':
          $rootScope.$broadcast('unauthorized', {
            message: 'Log on problem. Incorrect username or password.'
          });
          break;
        case '2':
          $rootScope.$broadcast('unauthorized', {
            message: 'Log on problem. Multiple matches for username.'
          });
          break;
        case '3':
          $rootScope.$broadcast('unauthorized', {
            message: ''
          });
          break;
        case '4':
          $rootScope.$broadcast('error', {
            message: 'Argument is missing from query.'
          });
          break
        case '5':
          $rootScope.$broadcast('error', {
            message: 'Edit problem – the case you are trying to edit could not be found.'
          });
          break;
        case '6':
          $rootScope.$broadcast('error', {
            message: 'Edit problem – the action you are trying to perform on this case is not permitted.'
          });
          break;
        case '7':
          $rootScope.$broadcast('error', {
            message: 'Time tracking problem – you can’t add a time interval to this case because the case can’t be found, is closed, has no estimate, or you don’t have permission'
          });
          break;
        case '8':
          $rootScope.$broadcast('error', {
            message: 'New case problem – you can’t write to any project.'
          });
          break;
        case '9':
          $rootScope.$broadcast('error', {
            message: 'Case has changed since last view.'
          });
          break;
        case '10':
          $rootScope.$broadcast('error', {
            message: 'Search problem – an error occurred in search.'
          });
          break;
        case '12':
          $rootScope.$broadcast('error', {
            message: 'Wiki creation problem.'
          });
          break;
        case '13':
          $rootScope.$broadcast('error', {
            message: 'Wiki permission problem.'
          });
          break;
        case '14':
          $rootScope.$broadcast('error', {
            message: 'Wiki load error.'
          });
          break;
        case '15':
          $rootScope.$broadcast('error', {
            message: 'Wiki template error.'
          });
          break;
        case '16':
          $rootScope.$broadcast('error', {
            message: 'Wiki commit error.'
          });
          break;
        case '17':
          $rootScope.$broadcast('error', {
            message: 'No such project.'
          });
          break;
        case '18':
          $rootScope.$broadcast('error', {
            message: 'No such user.'
          });
          break;
        case '19':
          $rootScope.$broadcast('error', {
            message: 'Area creation problem.'
          });
          break;
        case '20':
          $rootScope.$broadcast('error', {
            message: 'Milestone creation problem.'
          });
          break;
        case '21':
          $rootScope.$broadcast('error', {
            message: 'Project creation problem.'
          });
          break;
        case '22':
          $rootScope.$broadcast('error', {
            message: 'User creation problem.'
          });
          break;
        case '23':
          $rootScope.$broadcast('error', {
            message: 'Project percent time problem.'
          });
          break;
        case '24':
          $rootScope.$broadcast('error', {
            message: 'No such milestone.'
          });
          break;
        case '25':
          $rootScope.$broadcast('error', {
            message: 'Violates milestone execution order.'
          });
          break;
        case '27':
          $rootScope.$broadcast('error', {
            message: 'No such API command.'
          });
          break;
        case '28':
          $rootScope.$broadcast('error', {
            message: 'Account in Maintenance Mode.'
          });
          break;
        default:
          $rootScope.$broadcast('error', {
            message: 'Unspecified error.'
          });
          break;
      };
    }
    return response;
  };

  service.responseError = function(rejection) {
    $rootScope.$broadcast('http-error', {
      message: 'Check your network connection and try again'
    });
    return $q.reject(rejection);
  };
});
