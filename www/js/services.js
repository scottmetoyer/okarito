// Shared service utility functions
function transform(data) {
    var x2js = new X2JS();
    var json = x2js.xml_str2json(data);
    return json;
}

angular.module('okarito.services', ['angular-storage'])

.factory('userService', function(store) {
  var currentUser = {
    api_url: '',
    email: '',
    access_token: ''
  };

  return {
    setCurrentUser: function(user) {
      currentUser = user;
      store.set('user', user);
      return currentUser;
    },
    getCurrentUser: function() {
      if (!currentUser) {
        currentUser = store.get('user');
      }
      return currentUser;
   }
  }
})

.factory('dataService', function ($http, userService) {;
  var data = this;
  data.currentUser = userService.getCurrentUser();

  return {
    getCase: function (id) {
      return $http.get(data.currentUser.api_url + 'cmd=search&q=' + id + '&cols=sTitle,ixBug,sProject',
        { transformResponse: transform });
    },
    getCases: function (filter) {
      return $http.get(data.currentUser.api_url + 'cmd=search&q=' + filter + '&cols=sTitle,ixBug',
        { transformResponse: transform });
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
          user.api_url = root + response.data.response.url;

          return $http.get(user.api_url + 'cmd=logon&email=' + userEmail + '&password=' + password,
            { transformResponse: transform });
        })
        .then(function(response) {
          user.access_token = response.data.response.token;
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

.service('authInterceptor', function($q, $rootScope, userService){
  var service = this;

  service.request = function(config) {
    var currentUser = userService.getCurrentUser();
    var access_token = currentUser ? currentUser.access_token : null;

    // If the request is a FogBugz command and we have a token save, append it
    if (config.url.indexOf('cmd=') > -1 && config.url.indexOf('cmd=logon') == -1) {
      if (access_token) {
        config.url = config.url + '&token=' + access_token;
      } else {
        $rootScope.$broadcast('unauthorized');
      }
    }

    return config;
  };

  service.response = function(response) {
    if (response.data.response && response.data.response.error) {
      $rootScope.$broadcast('unauthorized');
    }
    return response;
  };

  service.responseError = function(rejection) {
    $rootScope.$broadcast('http-error');
    return $q.reject(rejection);
  };
});
