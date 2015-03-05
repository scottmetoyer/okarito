// Shared service utility functions
function transform(data) {
    var x2js = new X2JS();
    var json = x2js.xml_str2json(data);
    return json;
}

angular.module('okarito.services', [])

.factory('authService', function ($http) {
    var apiUrlPromise;

    return {
        setToken: function(token) {
            window.localStorage.setItem('token', token);
        },
        getToken: function() {
            return window.localStorage.getItem('token');
        },
        getApiUrl: function (root) {
            if (!apiUrlPromise) {
                apiUrlPromise = $http.get(root + 'api.xml', { transformResponse: transform });
            }
            return apiUrlPromise;
        },
        loginUser: function (email, password, apiUrl) {
            return $http.get(apiUrl + "cmd=logon&email=" + email + "&password=" + password,
                    { transformResponse: transform });
        }
    }
})

.factory('dataService', function ($http, authService) {
    var properties = authService.getProperties();
    var token = properties.token;
    var apiUrl = properties.apiUrl;

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