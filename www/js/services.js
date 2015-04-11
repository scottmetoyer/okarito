// Shared service utility functions
function transform(data) {
    var x2js = new X2JS();
    var json = x2js.xml_str2json(data);
    return json.response;
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

.factory('dataService', function ($http, userService) {;
  var x2js = new X2JS();
  var data = this;
  var cases = {};
  var filters = {};

  return {
    getFilters: function() {
      return $http.get('cmd=listFilters',
        { transformResponse: transform }).then(function(response){
          filters = x2js.asArray(response.data.filters.filter);
          return filters;
        });
    },
    getCase: function (id) {
      var bug = null;

      for (var i = 0; i < cases.length; i++) {
        if (cases[i].ixBug == id) {
          bug = cases[i];
        }
      }

      return bug;
    },
    getProjects: function() {
      return $http.get('cmd=listProjects',
        { transformResponse: transform }).then(function(response){
          return x2js.asArray(response.data.projects.project);
        });
    },
    getPriorities: function() {
      return $http.get('cmd=listPriorities',
        { transformResponse: transform }).then(function(response){
          return x2js.asArray(response.data.priorities.priority);
        });
    },
    getStatuses: function(categoryId) {
      return $http.get('cmd=listStatuses&ixCategory=' + categoryId,
        { transformResponse: transform }).then(function(response){
          return x2js.asArray(response.data.statuses.status);
        });
    },
    getPeople: function() {
      return $http.get('cmd=listPeople',
        { transformResponse: transform }).then(function(response){
          return x2js.asArray(response.data.people.person);
        });
    },
    getCategories: function() {
      return $http.get('cmd=listCategories',
        { transformResponse: transform }).then(function(response){
          return x2js.asArray(response.data.categories.category);
        });
    },
    getAreas: function(projectId) {
      return $http.get('cmd=listAreas&ixProject=' + projectId,
        { transformResponse: transform }).then(function(response){
          return x2js.asArray(response.data.areas.area);
        });
    },
    getMilestones: function(projectId) {
      return $http.get('cmd=listFixFors&ixProject=' +projectId,
        { transformResponse: transform }).then(function(response){
          return x2js.asArray(response.data.fixfors.fixfor);
        });
    },
    getCases: function (filter) {
      return $http.get('cmd=search&q=' + filter + '&cols=sTitle,ixBug,sProject,ixProject,sArea,ixArea,sPriority,ixPriority,sFixFor,ixFixFor,ixStatus,sStatus,sCategory,ixCategory,sPersonAssignedTo,ixPersonAssignedTo,sEmailAssignedTo,tags,events',
        { transformResponse: transform }).then(function(response) {
          cases = x2js.asArray(response.data.cases.case);
          return cases;
        });
    },
    setFilter: function(filterId) {
      return $http.get('cmd=setCurrentFilter&sFilter=' + filterId);
    },
    saveCase: function(bug) {
      return $http({
        method: 'POST',
        url: '',
        data: "cmd=edit&ixBug=" + bug.ixBug +
              "&sTitle=" + bug.sTitle.__cdata +
              "&ixArea=" + bug.area.ixArea +
              "&ixStatus=" + bug.status.ixStatus +
              "&ixProject=" + bug.project.ixProject +
              "&ixPriority=" + bug.priority.ixPriority +
              "&ixCategory=" + bug.category.ixCategory +
              "&ixFixFor=" + bug.milestone.ixFixFor +
              "&ixPersonAssignedTo=" + bug.personAssignedTo.ixPerson,
        headers: {'Content-Type': 'application/x-www-form-urlencoded'},
        transformResponse: transform
      }).then(function(response){
        // Save success
        return response;
      });
    }
  }
})

.service('loginService', function($q, $http) {
  return {
    loginUser: function(userEmail, password, root) {
      var deferred = $q.defer();
      var promise = deferred.promise;
      var user = {
        email: userEmail,
        api_url : '',
        access_token: ''
      };

      root = root.replace(/\/?$/, '/');

      $http
        .get(root + 'api.xml',{ transformResponse: transform })
        .then(function(response) {
          // Retrive the FogBugz API url
          user.api_url = root + response.data.url;
          console.log(response);
          return $http.get(user.api_url + 'cmd=logon&email=' + userEmail + '&password=' + password,
            { transformResponse: transform });
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
    categoryIcon: function (categoryId) {
        var icon = '';

        switch (categoryId)
        {
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

.service('authInterceptor', function($q, $rootScope, userService){
  var service = this;

  service.request = function(config) {
    var currentUser = userService.getCurrentUser();
    var access_token = currentUser ? currentUser.access_token : null;
    var api_url = currentUser ? currentUser.api_url : null;

    // Process GET requests
    if (config.method == 'GET')
    {
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
    if (config.method == 'POST')
    {
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
      switch(code)
      {
        case '3':
          // Not logged in
          break;

        default:
      };

      $rootScope.$broadcast('unauthorized');
    }
    return response;
  };

  service.responseError = function(rejection) {
    $rootScope.$broadcast('http-error');
    return $q.reject(rejection);
  };
});
