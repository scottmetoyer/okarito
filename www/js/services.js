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
    loginUser: function(email, password, apiUrl) {
      return $http.get(apiUrl + 'cmd=logon&email=' + email + '&password=' + password,
        { transformResponse: transform });
    },
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
    getApiUrl: function (root) {
      return $http.get(
        root + 'api.xml',
        { transformResponse: transform });
      },
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

.service('authInterceptor', function($rootScope, userService){
  var service = this;

  service.request = function(config) {
    var currentUser = userService.getCurrentUser();
    var access_token = currentUser ? currentUser.access_token : null;

    // If the request is a FogBugz command and we have a token save, append it
    if (access_token) {
        if (config.url.indexOf('cmd=') > -1) {
          config.url = config.url + '&token=' + access_token;
        }
    } else {
      $rootScope.$broadcast('unauthorized', { message: 'Please log in to your FogBugz account to continue' });
    }

    return config;
  };

  service.response = function(response) {
    if (response.data.response && response.data.response.error) {
      $rootScope.$broadcast('unauthorized', { message: response.data.response.error });
    }

    return response;
  };

  service.responseError = function(response) {
    $rootScope.$broadcast('unauthorized', { message: response });
    throw('HTTP response error:' + response);
  };
});
