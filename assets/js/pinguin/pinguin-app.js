"use strict";

var app = angular.module('pinguin', ['ngRoute', 'pinguin.LocalStorageService','pascalprecht.translate'],
    function($routeProvider, $locationProvider, $translateProvider) {
        $routeProvider.when('/intro/:page', {
            templateUrl: '/templates/pinguin/intro',
            controller: IntroCtrl
        });

        $routeProvider.when('/404', {
            templateUrl: '/templates/pinguin/404'
        });

        $routeProvider.otherwise( {
            redirectTo: '/404'
        });


        $translateProvider.useStaticFilesLoader({
            prefix: 'admin/translates/get/',
            suffix: '/en/?group=0'
        });

        $translateProvider.preferredLanguage('en');
        // configure html5 to get links working on jsfiddle
        //$locationProvider.html5Mode(true);
    });
function requestPOST($http, func, data, success, failed){
    request('POST',$http, func, data, success, failed);
}

function requestGET($http, func, success, failed){
    request('GET',$http, func, null, success, failed);
}

function request(method, $http, func, data, success, failed){
    var ROUTE = '/pinguin/';



    $http({
        method: method,
        url: ROUTE + func,
        data: data}).
        success(function(data, status, headers, config) {
            console.log('request',data, status,headers,config);
            if(success){
                var response = data;

                if(data.response){
                    response = data.response;
                } else {
                    alertify.alert('no response field!');
                }

                success(response, status);
            }

        }).
        error(function(data, status, headers, config) {
            console.log(data, status);
            var errorMessage = data;
            if(data.error && data.error.detail){
                errorMessage = data.error.detail;
            } else if(data.error){
                errorMessage = data.error;
            }

            alertify.alert('Error:' + errorMessage);
            if(failed){
                failed(data, status);
            }

        });

}

function PinguinCtrl($scope, $location, $http, $routeParams,localStorageService) {

    var game = localStorageService.get('pinguin.game');
    //var base = {};
    if(game){
        $location.path('/world');
    } else {
        $location.path('/intro/1');
    }

}

function IntroCtrl($scope, $http, $routeParams) {
    var PAGEMAX = 4;

    $scope.page = parseInt($routeParams.page);
    if(isNaN($scope.page) || $scope.page < 1 || $scope.page > PAGEMAX){
        $scope.page = 1;
    }

    $scope.pageNext = $scope.page + 1;
    $scope.pagePrev = $scope.page - 1;

    if( $scope.pageNext > PAGEMAX) {
        $scope.pageNext = false;
    }
    if( $scope.pagePrev < 1) {
        $scope.pagePrev = false;
    }


}