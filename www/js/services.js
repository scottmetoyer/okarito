// Shared service utility functions
function transform(data) {
    var x2js = new X2JS();
    var json = x2js.xml_str2json(data);
    return json;
}

angular.module('okarito.services', [])

.factory('authService', function ($http, $localstorage) {
    var properties = {};

    return {
        getProperties: function () {
            var props = $localstorage.getObject('props');
            if (Object.keys(props).length) {
                return properties;
            } else {
                return null;
            }
        },
        setProperties: function (props) {
            properties = props;
            $localstorage.setObject('props', properties);
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
})

.factory('$localstorage', ['$window', function ($window) {
    return {
        set: function (key, value) {
            $window.localStorage[key] = value;
        },
        get: function (key, defaultValue) {
            return $window.localStorage[key] || defaultValue;
        },
        setObject: function (key, value) {
            $window.localStorage[key] = JSON.stringify(value);
        },
        getObject: function (key) {
            return JSON.parse($window.localStorage[key] || '{}');
        }
    }
}]);