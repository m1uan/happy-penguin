"use strict";

var app = angular.module('pinguin', ['ngRoute', 'pinguin.LocalStorageService','pascalprecht.translate'],
    function($routeProvider, $locationProvider, $translateProvider) {
        $routeProvider.when('/intro/:page', {
            templateUrl: '/templates/pinguin/intro',
            controller: IntroCtrl
        });

        $routeProvider.when('/world', {
            templateUrl: '/templates/levels/world',
            controller: WorldCtrl
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



function PinguinCtrl($scope, $location, $http, $routeParams,localStorageService) {

    var game = localStorageService.get('pinguin.game');
    //var base = {};

    game = {
        lang:'en',
        learn: 'en'
    }
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

function WorldCtrl($scope, $location, $http) {
    var element = $('#world-main');
    //console.log(element);
//    element.mousemove(function(evt) {
//        var x = evt.pageX - element.offset().left;
//        var y = evt.pageY - element.offset().top;
//
//        var portX = parseFloat(x)/parseFloat(element.width());
//        var portY = parseFloat(y)/parseFloat(element.height());
//        console.log({x:x, y:y, portX:portX, portY:portY});
//    });

    //element.click(onClick);
    update();

    function generateInfo(place){
        return place.name + place.name;
    }

    function update(){
        var url ='list/en/?fields=id,name,posx,posy';
        requestGET($http, url, function(response, status){
            console.log(response);
            $scope.places = response;

            $scope.places.forEach(function(pl){

                var item = $('<div data-toggle="tooltip" data-placement="left" title="'+pl.name+'">' + pl.id + '</div>').addClass('place');

                var left = parseFloat(1350) * parseFloat(pl.posx);
                var top = parseFloat(675) * parseFloat(pl.posy);

                item.css({top: top, left: left});
                item.appendTo(element);
                item.click(function(){
                    console.log('click');
                    $scope.$apply(function(){
                        $location.path('/place/'+pl.id);
                    })

                });

                item.popover({trigger:'hover',html:true,title:pl.name,content:function(){
                    return generateInfo(pl);
                }});

//                item.mouseenter(function(){
//
//                    console.log('tooltip');
//                })
//                item.mouseleave(function(){
//                    item.popover('hide');
//                    console.log('tooltip');
//                })

                console.log(pl, top, left, parseFloat(element.width()) , parseFloat(element.height()));
                //$('#world-main').append('ahoj').addClass('place');
            });
        });
    }



    element.dblclick(function(evt){

        var x = evt.pageX - element.offset().left;
        var y = evt.pageY - element.offset().top;

        var portX = parseFloat(x)/parseFloat(element.width());
        var portY = parseFloat(y)/parseFloat(element.height());
        alertify.prompt('portX:'+portX+ ' - protY:'+portY, function(e, placeName){
            if(e){
                var url = 'create/';
                requestPOST($http, url, {posx:portX, posy:portY, name:placeName}, function(response, status){
                    console.log(response)

                    update();
                    $location.path('/place/'+response.id);
                });


                console.log(' $location.path(/place/0)');
            }
        });

    });

}