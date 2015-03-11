// Shared service utility functions
function transform(data) {
    var x2js = new X2JS();
    var json = x2js.xml_str2json(data);
    return json;
}

angular.module('okarito.services')

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
      return $http.get('cmd=search&q=' + id + '&cols=sTitle,ixBug,sProject',
        { transformResponse: transform });
    },
    getCases: function (filter) {
      return $http.get('cmd=search&q=' + filter + '&cols=sTitle,ixBug',
        { transformResponse: transform });
    }
  }
})

.service('fogbugzApiInterceptor', function($rootScope, userService){
  var service = this;

  service.request = function(config) {
    var currentUser = userService.getCurrentUser();
    var access_token = currentUser ? currentUser.access_token : null;
    var api_url = currentUser ? currentUser.api_url : null;

    // If the API url exists, prepend it to the request

    // If the token exists, append it to the request

    config.url = 'https://scottmetoyer.fogbuz.com?api.asp?' + config.url;

    return config;
  };

  service.responseError = function(response) {
    if (response.data.response.error) {
      console.log(response.data.response.error);
    }

    return response;
  };
});
