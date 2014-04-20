var app = angular.module('voc4u', ['ngRoute', 'ngAnimate', 'ngCookies'],
    function($routeProvider, $locationProvider) {




        // configure html5 to get links working on jsfiddle
        //$locationProvider.html5Mode(true);
    });

function requestPOST($http, func, data, success, failed){
    var ROUTE = '/admin/translates/';



    $http({
        method: 'POST',
        url: ROUTE + func,
        data: data}).
        success(function(data, status, headers, config) {
            console.log(data, status);
            success(data, status);
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
            failed(data, status);
        });

}



function MainCtrl($scope) {

}


function AddLangCtrl($scope, $http) {
    $scope.lang_code = 'en';
    $scope.lang_eng_name = 'English';


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
        }, function(failed){

        });



    }
}