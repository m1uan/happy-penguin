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

    if(!game){
        game = createNewGame(localStorageService);
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


    var game = localStorageService.get('pinguin.game');

    $scope.fly = game.fly;
    $scope.walk = game.walk;
    $scope.swim = game.swim;
    $scope.exp = game.exp;


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
            $scope.placesIds = {};


            $scope.places.forEach(function(pl){
                $scope.placesIds[pl.id] = pl;
                var item = $('<div data-toggle="tooltip" data-placement="left" title="'+pl.name+'">' + pl.id + '</div>').addClass('place');

                var left = parseFloat(1350) * parseFloat(pl.posx) - 12;
                var top = parseFloat(675) * parseFloat(pl.posy) -12;


                item.css({top: top, left: left});
                item.appendTo(element);
                item.click(function(){
                    moveToPlace(pl);
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
            setupPlacesDistancesAndExp();
            showPenguin();
            testEndGame();
        });
    }


    function showPenguin(){
        var item = $('#penguin');

        if(!item.length){
            item  = $('<img id="penguin" src="assets/img/pinguin/penguin_3.png"/>');
            item.appendTo(element);
        }





        var w2 = 18;//(item.clientWidth/2);
        var h2 = 34;//(item.clientHeight/2);

        var gamePlace = $scope.placesIds[game.placeId];


        var left = parseFloat(1350) * parseFloat(gamePlace.posx) - w2;
        var top = parseFloat(675) * parseFloat(gamePlace.posy) - h2;


        item.css({top: top, left: left});
    }


    function moveToPlace(place){
        if($scope.fly < place.fly){
            alertify.error('Sorry you have enought FLY... you have just ' + $scope.fly+ ' but you need at least '+place.fly);
            $('#game_resources_fly').css({color:'red'});
        } else if($scope.swim < place.swim){
            alertify.error('Sorry you have enought SWIM... you have just ' + $scope.swim+ ' but you need at least '+place.swim);
            $('#game_resources_swim').css({color:'red'});
        } else if($scope.walk < place.walk){
            alertify.error('Sorry you have enought WALK... you have just ' + $scope.walk+ ' but you need at least '+place.walk);
            $('#game_resources_walk').css({color:'red'});
        } else {
            $scope.$apply(function(){
                $scope.fly -= place.fly;
                $scope.swim -= place.swim;
                $scope.walk -= place.walk;

                game.placeId = place.id;
                game.visited.push(game.placeId);
                showPenguin();
                setupPlacesDistancesAndExp();


                game.fly = $scope.fly;
                game.swim = $scope.swim;
                game.walk = $scope.walk;

                localStorageService.set('pinguin.game', game);

                testEndGame();
                //element.hide();
                //$location.path('/place/'+pl.id);
            })
        }
    }


    function setupPlacesDistancesAndExp(){
        var gamePlace = $scope.placesIds[game.placeId];

        $scope.places.forEach(function(place){
            var xd = gamePlace.posx - place.posx;
            var yd = gamePlace.posy - place.posy;
            var distance = Math.sqrt((xd*xd)+(yd*yd));
            place.superDistance = Math.round(distance*100);

            place.fly = Math.round(place.superDistance / 9);
            place.swim = Math.round((place.superDistance - (place.fly*6)) / 3);
            place.walk = (place.superDistance - (place.fly*5) - (place.swim*2));
        });

    }


    function testEndGame(){
        var canPlay = $scope.places.some(function(place){
            return place.id != game.placeId &&  place.fly <= game.fly && place.swim <= game.swim && place.walk <= game.walk;
        });


        if(!canPlay){
            alertify.alert('Game over!');
            game = createNewGame(localStorageService);
            showPenguin();
            setupPlacesDistancesAndExp();
        }
    }



}


function createNewGame(localStorageService){
    var game = {
        fly : 20,
        swim :20,
        walk :20,
        exp : 20,
        lang:'en',
        learn: 'en',
        posx: 0.525925925925926,
        posy: 0.224296287254051,
        placeId : 6,
        visited : []
    }



    localStorageService.set('pinguin.game', game);

    return game;
}