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
        learn: 'en',
        posx: 0.525925925925926,
        posy: 0.224296287254051
    }

    localStorageService.set('pinguin.game', game);

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

function WorldCtrl($scope, $location, $http, localStorageService) {
    var self = this;
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

    $scope.fly = 10;
    $scope.walk = 10;
    $scope.swim = 10;
    $scope.exp = 10;

    var game = localStorageService.get('pinguin.game');

    self.generateInfo = function(place){
        var place_popover = $('#place_popover');
        place_popover.find('#place_popover_posx').text(place.posx);
        place_popover.find('#place_popover_posy').text(place.posy);
        place_popover.find('#place_popover_distance').text(place.superDistance);
        place_popover.find('#place_popover_fly').text(place.fly);
        place_popover.find('#place_popover_swim').text(place.swim);
        place_popover.find('#place_popover_walk').text(place.walk);
        return place_popover.html();
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

                var xd = game.posx - pl.posx;
                var yd = game.posy - pl.posy;
                var distance = Math.sqrt((xd*xd)+(yd*yd));


                pl.superDistance = Math.round(distance*100);

                pl.fly = Math.round(pl.superDistance / 9);
                pl.swim = Math.round((pl.superDistance - (pl.fly*6)) / 3);
                pl.walk = (pl.superDistance - (pl.fly*5) - (pl.swim*2));


                item.css({top: top, left: left});
                item.appendTo(element);
                item.click(function(){
                    if($scope.fly < pl.fly){
                        alertify.error('Sorry you have enought FLY... you have just ' + $scope.fly+ ' but you need at least '+pl.fly);
                        $('#game_resources_fly').css({color:'red'});
                    } else if($scope.swim < pl.swim){
                        alertify.error('Sorry you have enought SWIM... you have just ' + $scope.swim+ ' but you need at least '+pl.swim);
                        $('#game_resources_swim').css({color:'red'});
                    } else if($scope.walk < pl.walk){
                        alertify.error('Sorry you have enought WALK... you have just ' + $scope.walk+ ' but you need at least '+pl.walk);
                        $('#game_resources_walk').css({color:'red'});
                    } else {
                        $scope.$apply(function(){
                            $scope.fly -= pl.fly;
                            $scope.swim -= pl.swim;
                            $scope.walk -= pl.walk;

                            //$location.path('/place/'+pl.id);
                        })
                    }


                });

                item.popover({trigger:'hover',html:true,title:pl.name,content:function(){
                    return self.generateInfo(pl);
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