"use strict";

var app = angular.module('pinguin', ['ngRoute', 'penguin.LocalStorageService','penguin.game','pascalprecht.translate'],
    function($routeProvider, $locationProvider, $translateProvider) {
        $routeProvider.when('/intro/:page', {
            templateUrl: '/templates/penguin/intro',
            controller: IntroCtrl
        });

        $routeProvider.when('/world', {
            templateUrl: '/templates/levels/world',
            controller: WorldCtrl
        });

        $routeProvider.when('/wordstest/:placeid', {
            templateUrl: '/templates/penguin/wordstest',
            controller: WordsTestCtrl
        });

        $routeProvider.when('/404', {
            templateUrl: '/templates/penguin/404'
        });

        $routeProvider.otherwise( {
            redirectTo: '/world'
        });


        $translateProvider.useStaticFilesLoader({
            prefix: 'admin/translates/get/',
            suffix: '/en/?group=0'
        });

        $translateProvider.preferredLanguage('en');
        // configure html5 to get links working on jsfiddle
        //$locationProvider.html5Mode(true);
    });



function PinguinCtrl($scope, $location, $http, $routeParams,localStorageService,penguinGame) {


    //var base = {};
    var mygame = penguinGame.game();

    if(!mygame){
        mygame = penguinGame.createNewGame(localStorageService);
    }


    if(mygame){
        //$location.path('/world');
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

function WorldCtrl($scope, $location, $http, localStorageService, penguinGame) {
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




    penguinGame.update($scope);


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
        penguinGame.loadPlaces(function(places,placesIds){

            places.forEach(function(place){
                var item = $('<div data-toggle="tooltip" data-placement="left" title="'+place.name+'">' + place.id + '</div>').addClass('place');

                var left = parseFloat(1350) * parseFloat(place.posx) - 12;
                var top = parseFloat(675) * parseFloat(place.posy) -12;


                item.css({top: top, left: left});
                item.appendTo(element);
                item.click(function(){
                    moveToPlace(place);
                });

                item.popover({trigger:'hover',html:true,title:place.name,content:function(){
                    return self.generateInfo(place);
                }});
            });


            penguinGame.setupPlacesDistancesAndExp();
            testEndGame();
            showPenguin();
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

        var gamePlace = penguinGame.getCurrentPlace();

        var left = parseFloat(1350) * parseFloat(gamePlace.posx) - w2;
        var top = parseFloat(675) * parseFloat(gamePlace.posy) - h2;


        item.css({top: top, left: left});
    }


    function moveToPlace(place){
        //$location.path('/wordstest/'+place.id);
        if(penguinGame.game().fly < place.fly){
            alertify.error('Sorry you have enought FLY... you have just ' + penguinGame.game().fly+ ' but you need at least '+place.fly);
            $('#game_resources_fly').css({color:'red'});
        } else if(penguinGame.game().swim < place.swim){
            alertify.error('Sorry you have enought SWIM... you have just ' + penguinGame.game().swim+ ' but you need at least '+place.swim);
            $('#game_resources_swim').css({color:'red'});
        } else if(penguinGame.game().walk < place.walk){
            alertify.error('Sorry you have enought WALK... you have just ' + penguinGame.game().walk+ ' but you need at least '+place.walk);
            $('#game_resources_walk').css({color:'red'});
        } else {
            $scope.$apply(function(){


                penguinGame.setPlace(place);

                showPenguin();
                penguinGame.setupPlacesDistancesAndExp();
                penguinGame.update($scope);

                testEndGame();
                //element.hide();

            })
        }
    }


    function testEndGame(){
        if(!penguinGame.testEndGame()){
            alertify.alert('Game over!');
            penguinGame.createNewGame();
            penguinGame.setupPlacesDistancesAndExp();
        }
    }





}


function WordsTestCtrl($scope, $http){
    requestGET($http, '/words/get/1001/cs/en?fields=link,word%20as%20w&deleted=false&type=api',function(data){
        $scope.words = data.words;
    });
}

