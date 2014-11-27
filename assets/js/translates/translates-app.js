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

        $routeProvider.when('/import/:lang', {
            templateUrl: '/templates/translates/import',
            controller: ImportCtrl
        });

        $routeProvider.otherwise( {
            templateUrl: '/templates/translates/langs',
            controller: AddLangCtrl
        });


        // configure html5 to get links working on jsfiddle
        //$locationProvider.html5Mode(true);
    });


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

            $scope.translates.splice(0,0,data);

            //loadTranslates();
        });
    };

    $scope.showUpdateDialog = function(trans){
        $scope.updatekey = trans.key;
        $scope.updatedesc = trans.desc;
        $scope.updatelink = trans.link;
        $scope.updategroup = trans.group;


        $('#modal-update-desc').modal('show');
    }

    $scope.doUpdate = function(){
        var dataContainer = {
            link : $scope.updatelink,
            key :  $scope.updatekey,
            desc: $scope.updatedesc,
            group: $scope.updategroup
        };

        requestPOST($http, 'updatedesc/', dataContainer, function(data){
            console.log('comming data', data);
            $scope.translates.some(function(trans){
                if(trans.link == dataContainer.link){
                    trans.desc = data[0].desc;
                    trans.key = data[0].key;
                    trans.group = data[0].group;
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
        var url = 'get/'+$scope.lang+'/?fields=link,key,desc,data,group'
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


function ImportCtrl($scope, $http, $location,$routeParams) {
    console.log($routeParams);
    $scope.lang = $routeParams.lang;
    $scope.datacsv = '';


    loadcsv();

    $scope.import = function(){
        alertify.confirm('are you sure import the data?', function(e){
            if(e){
                requestPOST($http, 'import/'+$scope.lang+'/', {csv:$scope.datacsv}, function(data){
                    $location.path('/trans/0/'+$scope.lang);
                    alertify.log('CSV imported to ' + $scope.lang);
                });
            }
        });
    }

    function loadcsv(){
        var date = new Date();

        var url = 'get/'+$scope.lang+'/?'
            + 'type=csv'
            + '&timestamp='+ date.getMilliseconds();
        requestGET($http, url, function(response, status){
            console.log('response',response);
            $scope.datacsv = response;
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

        requestGET($http, 'langs/?fields=name,translate,lang,enable&timestamp='+date.getMilliseconds(), function(response, status){
            $scope.langs=response.langs;


        });
    }



}