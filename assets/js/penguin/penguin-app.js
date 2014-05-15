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
    var map = null;
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

            var markers = [];
            places.forEach(function(pl){
                var marker = {latLng: [pl.posx, pl.posy], name: pl.name, style: {r: 8, fill: 'yellow'}};
                markers.push(marker);
                //map.addMarker(''+pl.id, marker);
                //$('#world-main').append('ahoj').addClass('place');

            });

            map.addMarkers(markers);


            worldFactory.setupPlacesDistancesAndExp();
            testEndGame();
            showPenguin();
        });
    }


    function showPenguin(){
        var currPlace = worldFactory.getCurrentPlace();

        // showPenguin is call from onViewportChange
        // but placesInWorldIds is still null
        if(!currPlace){
            return;
        }

        var currentMarkers = {latLng: [currPlace.posx, currPlace.posy]};

        var v = map.getMarkerPosition(currentMarkers);

        var item = $('#penguin2');

        if(!item.length){
            item  = $('<img id="penguin2" src="assets/img/pinguin/penguin_3.png"/>');
            item.appendTo(jQuery('#world-main'));
        }

        item.css({top: v.y-30, left: v.x-18});




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


    jQuery(function(){

        element.vectorMap({
            onRegionClick:function(event, code){
                console.log('region-over', event, code);
            },onMarkerClick:function(event, marker, over){
                console.log('region-over', event, marker, over);
                var item  = $('<img src="assets/img/pinguin/penguin_3.png"/>');
                item.appendTo(event.target);
                //event.target.add('<div>ahoj</div>');

            },onMarkerOver: function(e1,e2){

            },onViewportChange : function(e1,e2,e3,e4){
                /*console.log('onViewportChange', e1, e2, e3, e4);
                 e2.repositionMarkers();
                 var v = e2.getMarkerPosition(markers[2]);
                 console.log(e2, v);

                 var item = $('#penguin2');

                 if(!item.length){
                 item  = $('<img id="penguin2" src="assets/img/pinguin/penguin_3.png"/>');
                 item.appendTo(jQuery('#world-map'));
                 }

                 item.css({top: v.y +40, left: v.x-12});*/
                if(!map){
                    map = e2;
                    update();
                } else {
                    showPenguin();
                }
            },
            backgroundColor: '#8888ff',
            borderColor: '#000',
            borderOpacity: 0.9,
            borderWidth: 30,
            color: '#f4fff0',
            markersSelectable: true,
            markersSelectableOne: true,
            focusOn: {
                x: 0.5,
                y: 0.5,
                scale: 2
            },map: 'world_mill_en',series: {
                regions: [{
                    values: {
                        "CZ":'#22FF22',
                        "DE":2
                    }
                }]
            }});
    });


}


function WordsTestCtrl($scope, $http, $routeParams, vocabularyFactory, worldFactory, $interval, $location){

    var BUTTON_STATUS_NORMAL = 0;
    var BUTTON_STATUS_SELECT = 1;
    var BUTTON_STATUS_CORRECT = 2;
    var BUTTON_STATUS_WRONG = 3;

    var GAME_TIME = 6;

    $scope.correct = 0;
    $scope.correctTotal = 20;
    $scope.wrong = 11;
    $scope.timer = GAME_TIME;

    $scope.part = 0;

    $scope.score = {
        fly : 1,
        swim : 2,
        walk : 1,
        exp : 0
    }


    var placeid = $routeParams.placeid;

    //startVocabularyTest();
    showIntroduction();


    function showQuestion(){
        // if not question there jump to the conclusion
        if(!$scope.place.questions || $scope.place.questions.length < 1){
            $scope.user_answered = 1;
            $scope.conclusion();
            return;
        }

        // load place is here just for debuginin
        // can be switch in initial insead showIntroducitin
        // and manipulate with layout and so on
        worldFactory.loadPlace(placeid, function(place){
            $scope.place = place;
            $scope.part = 3;

            if($scope.place.questions && $scope.place.questions.length > 0){
                var pos = worldFactory.getRandomNumber('question_place_'+placeid, $scope.place.questions.length);

                $scope.questionText = $scope.place.questions[pos].question;
                var answers = $scope.place.questions[pos].answers;
                $scope.questionAnswers = answers.split(';');

            }

            showRandomBackground();
        });
    }

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

            if($scope.timer % 10 == 0){
                showRandomBackground();
            }

            if($scope.timer == 0){
                showQuestion();
            }

        }, 1000, GAME_TIME);
    }



    function showRandomBackground(){
        var img = '/assets/img/orig/place/1399279830623-27882-ldhox9.jpg'
        if($scope.place.images && $scope.place.images.length > 0){
            var pos = worldFactory.getRandomNumber('image_place_'+placeid,$scope.place.images.length);

            img = '/assets/img/orig/' + $scope.place.images[pos].image;
            $scope.lastBackgroundImage = pos;
        }


        $('#vt_background').css("background-image", "url("+img+")");
    }


    $scope.visit = function(){
        $scope.part = 1;
        startVocabularyTest();
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


    $scope.answer = function(){
        if(!$scope.user_answer){
            return ;
        }

        $scope.user_answered = $scope.questionAnswers.some(function(ans){
            return ans == $scope.user_answer;
        }) ? 2 : 1;

        $scope.score.exp = $scope.user_answered;
        $scope.score.walk = Math.floor(($scope.correctTotal- $scope.wrong)/3);


    }

    $scope.conclusion = function(){
        $scope.part = 4;

    }

    $scope.backToMap = function(){
        $location.path('/world');
        worldFactory.addScore($scope.score);
    }
}

