var app = angular.module('voc4u', ['ngRoute', 'ngAnimate', 'ngCookies'],
    function($routeProvider, $locationProvider) {
        $routeProvider.when('/trans/:page/:lang', {
            templateUrl: '/templates/translates/trans',
            controller: TranslateCtrl
        });
        $routeProvider.when('/trans/:lang', {
            templateUrl: '/templates/translates/trans',
            controller: TranslateCtrl
        });


        $routeProvider.when('/langs', {
            templateUrl: '/templates/translates/langs',
            controller: AddLangCtrl
        });
        $routeProvider.otherwise( {
            templateUrl: '/templates/translates/langs',
            controller: AddLangCtrl
        });


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
    var ROUTE = '/admin/translates/';



    $http({
        method: method,
        url: ROUTE + func,
        data: data}).
        success(function(data, status, headers, config) {
            console.log(data, status);
            if(success){
                success(data.response, status);
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

            alert('Error:' + errorMessage);
            if(failed){
                failed(data, status);
            }

        });

}

function TranslateCtrl($scope, $routeParams) {
    console.log($routeParams);

    $scope.page = $routeParams.page;
    $scope.lang = $routeParams.lang;

}

function MainCtrl($scope) {

}


function AddLangCtrl($scope, $http) {
    $scope.lang_code = 'en';
    $scope.lang_eng_name = 'English';

    $scope.langs = [];

    loadLangs();

    $scope.addlang = function(valid){
        if(!valid){
            alert('not valid:\"' + $scope.lang_code + '\",\"'+ $scope.lang_eng_name + '\"');
            return ;
        }

        var dataContainer = {
            lang :  $scope.lang_code,
            name : $scope.lang_eng_name
        };

        requestPOST($http, 'addlang/', dataContainer, function(data){
            $scope.lang_code = '';
            $scope.lang_eng_name = '';
            loadLangs();
        }, function(failed){

        });



    }


    function loadLangs(){
        var date = new Date();

        requestGET($http, 'langs/?fields=name,translate,lang&timestamp='+date.getMilliseconds(), function(response, status){
            $scope.langs=response.langs;
        });
    }
}