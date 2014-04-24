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

function TranslateCtrl($scope, $http, $routeParams) {
    console.log($routeParams);

    $scope.page = $routeParams.page;
    $scope.lang = $routeParams.lang;

    $scope.translates = [];

    loadTranslates();

    $scope.key = '';
    $scope.desc = '';
    $scope.trans = '';


    $scope.add = function(){
        if(!$scope.trans){
            $scope.trans = $scope.desc;
        }
        var dataContainer = {
            lang :  $scope.lang,
            key : $scope.key,
            desc:  $scope.desc
        };


        requestPOST($http, 'add/', dataContainer, function(data){
            console.log(data);
            //trans.origin=data.data;

            //$scope.key = '';
            //$scope.desc = '';
            data.description = data.desc;
            $scope.translates.splice(0,0,data);

            //loadTranslates();
        });
    };

    $scope.showUpdateDialog = function(trans){
        $scope.updatekey = trans.key;
        $scope.updatedesc = trans.description;
        $scope.updatelink = trans.link;

        $('#modal-update-desc').modal('show');
    }

    $scope.doUpdate = function(){
        var dataContainer = {
            link : $scope.updatelink,
            key :  $scope.updatekey,
            desc: $scope.updatedesc
        };

        requestPOST($http, 'updatedesc/', dataContainer, function(data){
            console.log('comming data', data);
            $scope.translates.some(function(trans){
                if(trans.link == dataContainer.link){
                    trans.description = data[0].description;
                    trans.key = data[0].key;
                    console.log('trans',trans);
                    return true;
                } else {
                    return false;
                }
            })
        });
    }

    $scope.save = function(trans){
        console.log(trans);

        var dataContainer = {
            lang :  $scope.lang,
            link : trans.link,
            data:  trans.data
        };

        requestPOST($http, 'update/', dataContainer, function(data){
            console.log(data);
            trans.origin=data.data;
            //loadTranslates();
        });

    }

    function loadTranslates(){
        var date = new Date();
        var url = 'get/'+$scope.lang+'/?fields=link,key,description,data'
                    + '&lastUpdateFirst=true'
                    + '&type=api'
                    + '&timestamp='+ date.getMilliseconds();
        requestGET($http, url, function(response, status){
            $scope.translates=[];

            response.trans.forEach(function(trans){
                trans.origin = trans.data;


                $scope.translates.push(trans);
            });
        });
    }

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