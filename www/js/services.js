// Shared service utility functions
function transform(data) {
    var x2js = new X2JS();
    var json = x2js.xml_str2json(data);
    return json;
}

angular.module('okarito.services', [])

.factory('userService', function() {
  var currentUser = {
    api_url: '',
    email: '',
    access_token: 'xxxxxx'
  };

  return {
    getCurrentUser: function() {
      return currentUser;
    }
  }
})

.factory('dataService', function ($http) {;

  return {
    getApiUrl: function (root) {
      return $http.get(
        root + 'api.xml',
        { transformResponse: transform });
      },
    getCase: function (id) {
      return $http.get('https://scottmetoyer.fogbugz.com/api.asp?cmd=search&q=' + id + '&cols=sTitle,ixBug,sProject',
        { transformResponse: transform });
    },
    getCases: function (filter) {
      return $http.get('https://scottmetoyer.fogbugz.com/api.asp?cmd=search&q=' + filter + '&cols=sTitle,ixBug',
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
    }

    return config;
  };

  service.response = function(response) {
    if (response.data.response && response.data.response.error) {
      $rootScope.$broadcast('unauthorized');
    }

    return response;
  };

  service.responseError = function(response) {
    $rootScope.$broadcast('unauthorized');
    throw('Failed sucka');
  };
});
