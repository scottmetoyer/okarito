// Shared service utility functions
function transform(data) {
    var x2js = new X2JS();
    var json = x2js.xml_str2json(data);
    return json;
}

angular.module('okarito.services', [])

.factory('authService', function ($http) {
    return {
        getToken: function () {
            var token = window.localStorage.getItem("token");
            return token;
        },
        getApiUrl: function (root) {
            return $http.get(root + 'api.xml',
                { transformResponse: transform });
        },
        loginUser: function (email, password, apiUrl) {
            return $http.get(apiUrl + "cmd=logon&email=" + email + "&password=" + password,
                    { transformResponse: transform });
        }
    }
})

.factory('dataService', function ($http) {
    return {
        getCase: function (id) {

        },
        getCases: function (filter, apiUrl, token) {
            return $http.get(apiUrl + 'cmd=search&q=' + filter + '&token=' + token + '&cols=sTitle,ixBug',
                    { transformResponse: transform });
        }
    }
});
