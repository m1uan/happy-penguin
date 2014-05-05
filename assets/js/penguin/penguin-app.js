"use strict";

var app = angular.module('pinguin', ['ngRoute', 'penguin.LocalStorageService','milan.world.factory','milan.vocabulary.factory','pascalprecht.translate'],
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



function PinguinCtrl($scope, $location, $http, $routeParams,localStorageService,worldFactory) {


    //var base = {};
    var mygame = worldFactory.game();

    if(!mygame){
        mygame = worldFactory.createNewGame(localStorageService);
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

function WorldCtrl($scope, $location, $http, localStorageService, worldFactory) {
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




    worldFactory.update($scope);


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
        worldFactory.loadPlaces(function(places,placesIds){

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


            worldFactory.setupPlacesDistancesAndExp();
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

        var gamePlace = worldFactory.getCurrentPlace();

        var left = parseFloat(1350) * parseFloat(gamePlace.posx) - w2;
        var top = parseFloat(675) * parseFloat(gamePlace.posy) - h2;


        item.css({top: top, left: left});
    }


    function moveToPlace(place){
        $location.path('/wordstest/'+place.id);
        if(worldFactory.game().fly < place.fly){
            alertify.error('Sorry you have enought FLY... you have just ' + worldFactory.game().fly+ ' but you need at least '+place.fly);
            $('#game_resources_fly').css({color:'red'});
        } else if(worldFactory.game().swim < place.swim){
            alertify.error('Sorry you have enought SWIM... you have just ' + worldFactory.game().swim+ ' but you need at least '+place.swim);
            $('#game_resources_swim').css({color:'red'});
        } else if(worldFactory.game().walk < place.walk){
            alertify.error('Sorry you have enought WALK... you have just ' + worldFactory.game().walk+ ' but you need at least '+place.walk);
            $('#game_resources_walk').css({color:'red'});
        } else {
            $scope.$apply(function(){


                worldFactory.setPlace(place);

                showPenguin();
                worldFactory.setupPlacesDistancesAndExp();
                worldFactory.update($scope);

                testEndGame();
                //element.hide();

            })
        }
    }


    function testEndGame(){
        if(!worldFactory.testEndGame()){
            alertify.alert('Game over!');
            worldFactory.createNewGame();
            worldFactory.setupPlacesDistancesAndExp();
        }
    }





}


function WordsTestCtrl($scope, $http, $routeParams, vocabularyFactory, worldFactory, $interval){

    var BUTTON_STATUS_NORMAL = 0;
    var BUTTON_STATUS_SELECT = 1;
    var BUTTON_STATUS_CORRECT = 2;
    var BUTTON_STATUS_WRONG = 3;

    var GAME_TIME = 6;

    $scope.correct = 0;
    $scope.correctTotal = 0;
    $scope.wrong = 0;
    $scope.timer = GAME_TIME;

    $scope.part = 0;

    var placeid = $routeParams.placeid;

    //startVocabularyTest();
    showIntroduction();

    function showIntroduction(){
        worldFactory.loadPlace(placeid, function(place){
            $scope.place = place;
            showRandomBackground();
        });
    }

    function startVocabularyTest(){
        loadOrNext();

        $interval(function(){
            $scope.timer -= 1;
        }, 1000, GAME_TIME);
    }



    function showRandomBackground(){
        //http://localhost:8080/assets/img/orig/place/1399279830623-27882-ldhox9.jpg
        var img = '/assets/img/orig/' + $scope.place.images[0].image;

        $('#vt_background').css("background-image", "url("+img+")");
    }



    function loadOrNext(){
        vocabularyFactory.getVocabularyRandomSet(function(words){
            $scope.correct = 0;
            $scope.words = words;
            console.log(words.word1)
            updateButtons();

        });
    }

    $scope.select = function(side, word, event){
        // button already coreclty selected
        if(word.status == BUTTON_STATUS_CORRECT) {
            return ;
        }


        // select this side to normal for case there is selected another button
        setStatusButton(side, BUTTON_STATUS_NORMAL);

        var status = BUTTON_STATUS_SELECT;

        if(!word.status){
            word.status = status;
        }



        var link1 = getLinkOfSelectedButton(0);
        var link2 = getLinkOfSelectedButton(1);

        if(link1 !=-1 && link2 !=-1){
            if(link2 == link1){
                status = BUTTON_STATUS_CORRECT;
                $scope.correctTotal+=1;
                $scope.correct+=1;
            } else {
                status = BUTTON_STATUS_WRONG;
                $scope.wrong+=1;
            }
            // select also second side of buttons with this status
            setStatusButton(side == 0 ? 1 : 0, status);
        }

        console.log(link1,link2,status);


        word.status = status;


        updateButtons();

        if(status == BUTTON_STATUS_CORRECT && $scope.correct == $scope.words.word1.length){
            loadOrNext();
        }
    }


    function updateButtons(){
        _updateButtons(0);
        _updateButtons(1);
    }

    function _updateButtons(side){
        var words = side == 0 ? $scope.words.word1 : $scope.words.word2;
        words.forEach(function(w,idx){
            var id = '#testbtn_'+side+'_' + idx;
            var btn = $(id);
            btn.removeClass('btn-default');
            btn.removeClass('btn-primary');
            btn.removeClass('btn-success');
            btn.removeClass('btn-warning');

            if(w.status == BUTTON_STATUS_SELECT){
                btn.addClass('btn-primary');
            } else if(w.status == BUTTON_STATUS_CORRECT){
                btn.addClass('btn-success');
            } else if(w.status == BUTTON_STATUS_WRONG){
                btn.addClass('btn-warning');
            } else {
                btn.addClass('btn-default');
            }


        })
    }


    function setStatusButton(side, status){
        var words = side == 0 ? $scope.words.word1 : $scope.words.word2;
        words.some(function(w,idx){
            if(w.status == BUTTON_STATUS_SELECT || w.status == BUTTON_STATUS_WRONG){
                w.status = status;
                return true;
            }
        });
    };


    function getLinkOfSelectedButton(side){
        var words = side == 0 ? $scope.words.word1 : $scope.words.word2;
        var link = -1;
        words.some(function(w,idx){
            if(w.status == BUTTON_STATUS_SELECT || w.status == BUTTON_STATUS_WRONG){
                link = w.link;
                return true;
            }
        });

        return link;
    };
}

