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
    getCase: function(id) {
      var bug = null;

      for (var i = 0; i < cases.length; i++) {
        if (cases[i].ixBug == id) {
          bug = cases[i];
        }
      }

      return bug;
    },
    refreshEvents: function(bug) {
      return $http.get('cmd=search&q=' + bug.ixBug + '&cols=events', {
        transformResponse: transform
      }).then(function(response) {
        var refreshedCase = normalizeArray(response.data.cases.case);

        if (refreshedCase.length > 0) {
          bug.events = refreshedCase[0].events;
        }

        return;
      });
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
    getStatuses: function(categoryId, cacheResponse) {
      return $http.get('cmd=listStatuses&ixCategory=' + categoryId, {
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
            icon: null
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
    getCases: function(filter, cacheResponse) {
      return $http.get('cmd=search&q=' + filter + '&cols=sTitle,ixBug,fOpen,sProject,ixProject,sArea,ixArea,sPriority,ixPriority,sFixFor,ixFixFor,ixStatus,sStatus,sCategory,ixCategory,sPersonAssignedTo,ixPersonAssignedTo,sEmailAssignedTo,tags,events', {
        transformResponse: transform,
        cache: cacheResponse
      }).then(function(response) {
        var description = response.data.description != undefined ? response.data.description.__cdata : 'Search: ' + filter;
        cases = normalizeArray(response.data.cases.case);
        return { cases: cases, description: description };
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
        }
      };
    },
    newCase: function(bug) {
      return $http({
        method: 'POST',
        url: '',
        data: "cmd=new" +
          "&sTitle=" + bug.sTitle.__cdata +
          "&ixArea=" + bug.ixArea +
          "&ixStatus=" + bug.ixStatus +
          "&ixProject=" + bug.ixProject +
          "&ixPriority=" + bug.ixPriority +
          "&ixCategory=" + bug.ixCategory +
          "&ixFixFor=" + bug.ixFixFor +
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
    resolveCase: function(bug) {
    },
    saveCase: function(bug) {
      return $http({
        method: 'POST',
        url: '',
        data: "cmd=edit&ixBug=" + bug.ixBug +
          "&sTitle=" + bug.sTitle.__cdata +
          "&ixArea=" + bug.ixArea +
          "&ixStatus=" + bug.ixStatus +
          "&ixProject=" + bug.ixProject +
          "&ixPriority=" + bug.ixPriority +
          "&ixCategory=" + bug.ixCategory +
          "&ixFixFor=" + bug.ixFixFor +
          "&ixPersonAssignedTo=" + bug.ixPersonAssignedTo,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        transformResponse: transform
      }).then(function(response) {
        // Save success
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

    $scope.categoryUpdated = function(val) {
      $scope.case.ixCategory = val;

      dataService.getStatuses(val, false)
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
          $rootScope.$broadcast('unauthorized');
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
          $rootScope.$broadcast('unauthorized');
        }
      }
    }

    return config;
  };

  service.response = function(response) {
    if (response.data && response.data.error) {
      console.log(response.data.error);

      // TODO: Appropriate actions based on the specific errors go here, ie. login error to unauthorized, saving errors show messagem etc.
      var code = response.data.error._code;
      switch (code) {
        case '3':
          // Not logged in
          $rootScope.$broadcast('unauthorized');
          break;

        case '4':
          // Argument is required
          break;
        default:
      };
    }
    return response;
  };

  service.responseError = function(rejection) {
    $rootScope.$broadcast('http-error');
    return $q.reject(rejection);
  };
});
