// Shared service utility functions
function transform(data) {
    var x2js = new X2JS();
    var json = x2js.xml_str2json(data);
    return json;
}

angular.module('okarito.services', [http-auth-interceptor])

.factory('authService', function ($http) {
    return {
        getApiUrl: function (root) {
          return $http.get(root + 'api.xml',
                      { transformResponse: transform });
        },
        loginUser: function (email, password, apiUrl) {
          return $http.get(apiUrl + 'cmd=logon&email=' + email + '&password=' + password,
                    { transformResponse: transform });
        }
    }
})

.factory('dataService', function ($http, authService) {
    var apiUrl = '';
    var token = '';

    return {
        getCase: function (id) {
            return $http.get(apiUrl + 'cmd=search&q=' + id + '&token=' + token + '&cols=sTitle,ixBug,sProject',
                   { transformResponse: transform });
        },
        getCases: function (filter) {
            return $http.get(apiUrl + 'cmd=search&q=' + filter + '&token=' + token + '&cols=sTitle,ixBug',
                    { transformResponse: transform });
        }
    }
});
