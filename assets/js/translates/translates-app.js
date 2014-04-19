var app = angular.module('voc4u', ['ngRoute', 'ngAnimate', 'ngCookies'],
    function($routeProvider, $locationProvider) {
        $routeProvider.when('/users/:lang1/:lang2', {
            templateUrl: 'templates/users',
            controller: UsersCtrl,
            controllerAs: 'users'
        });
        $routeProvider.when('/stats/:userId', {
            templateUrl: 'templates/stats',
            controller: StatsCtrl,
            controllerAs: 'book'
        });
        $routeProvider.when('/questions/:lang1/:lang2', {
            templateUrl: 'templates/words',
            controller: QuestionsCtrl,
            controllerAs: 'questions'
        });
        $routeProvider.when('/questions/:lang1/:lang2/:userId', {
            templateUrl: 'templates/words',
            controller: QuestionsCtrl,
            controllerAs: 'questions'
        });

        $routeProvider.when('/approveimages/:lang1/:lang2/:userId', {
            templateUrl: 'templates/words',
            controller: ApproveImageCtrl,
            controllerAs: 'questions'
        });

        $routeProvider.when('/approveimages/:lang1/:lang2', {
            templateUrl: 'templates/words',
            controller: ApproveImageCtrl,
            controllerAs: 'questions'
        });


        $routeProvider.when('/:lesson/:lang1/:lang2', {
            templateUrl: 'templates/words',
            controller: WordWebCtrl,
            controllerAs: 'wordwc'
        });





        // configure html5 to get links working on jsfiddle
        //$locationProvider.html5Mode(true);
    });

function MainCtrl($scope, $route, $routeParams, $location, $cookieStore, lastVisitService) {

}