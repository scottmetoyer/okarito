angular.module('okarito', ['ionic', 'okarito.controllers', 'monospaced.elastic'])

.run(function ($ionicPlatform, $rootScope) {
    $ionicPlatform.ready(function () {
        // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard for form inputs)
        if (window.cordova && window.cordova.plugins.Keyboard) {
            cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
        }
        if (window.StatusBar) {
            // org.apache.cordova.statusbar required
            StatusBar.styleDefault();
        }
    });
})

.config(function ($stateProvider, $urlRouterProvider, $httpProvider) {
    $stateProvider

    .state('app', {
        url: "/app",
        abstract: true,
        templateUrl: "templates/menu.html",
        controller: 'AppCtrl'
    })
    .state('app.search', {
        url: "/search",
        views: {
            'menuContent': {
                templateUrl: "templates/search.html"
            }
        }
    })
    .state('app.browse', {
        url: "/browse",
        views: {
            'menuContent': {
                templateUrl: "templates/browse.html"
            }
        }
    })
    .state('app.cases', {
        url: "/cases",
        views: {
            'menuContent': {
                templateUrl: "templates/cases.html",
                controller: 'CasesCtrl'
            }
        }
    })
    .state('app.single', {
        url: "/cases/:caseId",
        views: {
            'menuContent': {
                templateUrl: "templates/case.html",
                controller: 'CaseCtrl'
            }
        }
    });

    // if none of the above states are matched, use this as the fallback
    $urlRouterProvider.otherwise('/app/cases');

    // Add the authentication interceptor
    $httpProvider.interceptors.push('authInterceptor');
});
