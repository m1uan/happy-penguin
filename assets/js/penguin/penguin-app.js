"use strict";

var app = angular.module('pinguin', ['ngRoute', 'penguin.LocalStorageService','milan.penguin.factory','milan.world.factory','milan.vocabulary.factory','pascalprecht.translate'],
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

        $routeProvider.when('/gameover', {
            templateUrl: '/templates/penguin/gameover',
            controller: GameOverCtrl
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


function ExchangeDialog(){
    var exchange = $('#modal-exchange');

    // the values on inputs are put there from another controller
    // with the same jQuery technics, so the models are not actualised...
    // have to be recaived with the same technics
    var exp = exchange.find('#modal-exchange-exp');
    var walk = exchange.find('#modal-exchange_resources_walk');
    var swim = exchange.find('#modal-exchange_resources_swim');
    var fly = exchange.find('#modal-exchange_resources_fly');



    return {
        expToTravelers : function(){
            var e = parseInt(exp.val());
            if(e >= 3){
                exp.val(e - 3);
                walk.val(parseInt(walk.val())+1);
                swim.val(parseInt(swim.val())+1);
                fly.val(parseInt(fly.val())+1);
            }
        }, setup : function(e,w,s,f){
            exp.val(e);
            walk.val(w);
            swim.val(s);
            fly.val(f);
        }, show : function(onClick){
            exchange.modal('show');
            if(onClick){
                exchange.find('#modal-exchange-button').unbind().click(onClick);
            }

        },getValues : function(){
            return {exp:parseInt(exp.val()),walk:parseInt(walk.val()), swim:parseInt(swim.val()), fly:parseInt(fly.val())}
        }
    }
}
function PinguinCtrl($scope, $location, $http, $routeParams,localStorageService,worldFactory,penguinFactory,$translate) {

    $scope.langs = [];
    penguinFactory.getLangs('en', function(langs){

        $scope.langs = langs;

    })



    //var base = {};
    var mygame = worldFactory.game();

//    if(!mygame){
//        mygame = worldFactory.createNewGame(localStorageService);
//    }


    if(mygame){
        $location.path('/world');
    } else {
        $location.path('/intro/1');
    }


    $scope.changeLang = function(lang){
        if($translate.use() != lang){
            $translate.use(lang);
            alertify.success('lang changed to : ' + lang);
        }
        mixpanel.track("lang", lang);
    }

    $scope.expToTravelers = function(){
        ExchangeDialog().expToTravelers();

    }
}

function IntroCtrl($scope, $location, $routeParams,penguinFactory,worldFactory, $translate) {
    var PAGEMAX = 5;

    $scope.page = parseInt($routeParams.page);
    if(isNaN($scope.page) || $scope.page < 1 || $scope.page > PAGEMAX){
        $scope.page = 1;
    }

    $scope.langs = [];
    penguinFactory.getLangs($translate.use(), function(langs){

        $scope.langs = langs;
    });



    $scope.pageNext = $scope.page + 1;
    $scope.pagePrev = $scope.page - 1;

    if( $scope.pageNext > PAGEMAX) {
        $scope.pageNext = false;
    }
    if( $scope.pagePrev < 1) {
        $scope.pagePrev = false;
    }


    $scope.startGame = function(lang){
        alertify.error('jorney:' + lang + ' native:' + $translate.use());
        worldFactory.setup(lang,  $translate.use());
        worldFactory.createNewGame();
        $location.path('/world');
        mixpanel.track("Start game", {jorney:lang, native: $translate.use()});
    }

    var mixdata = {
        page : $scope.page,
        native: $translate.use()
    }


    mixpanel.track("intro", mixdata);

}

function WorldCtrl($scope, $location, $http, localStorageService, worldFactory, $translate) {
    var self = this;
    var element = $('#world-main');
    var map = null;
    var places;
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


    $scope.showExchange = function(){


        var ed = ExchangeDialog();
        ed.setup(worldFactory.game().exp, worldFactory.game().walk, worldFactory.game().swim, worldFactory.game().fly);
        ed.show(function(){
            $scope.$apply(function(){
                var values = ed.getValues();
                var score = {
                    exp: values.exp - parseInt(worldFactory.game().exp),
                    walk : values.walk - parseInt(worldFactory.game().walk),
                    swim : values.swim - parseInt(worldFactory.game().swim),
                    fly : values.fly - parseInt(worldFactory.game().fly)
                }


                console.log('score', score, values);
                worldFactory.addScore(score);

                worldFactory.update($scope);

                //testEndGame();
                //element.hide();

            })
        });

    }

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

    function updatePlaces(places){
            places.forEach(function(place){

                var placeid = 'placeid_'+place.id;
                var item = $('#'+placeid);

                if(!item.length){
                    var item = $('<div id="'+placeid+'" data-toggle="tooltip" data-placement="left" title="'+place.name+'">' + place.id + '</div>').addClass('place');

                    item.appendTo(element);
                    item.click(function(){
                        moveToPlace(place);
                    });

                    item.popover({trigger:'hover',html:true,title:place.name,content:function(){
                        return self.generateInfo(place);
                    }});
                }

                var pos = map.latLngToPoint(place.posx, place.posy);
                item.css({top: pos.y-14, left: pos.x-14});


//                var marker = {latLng: [pl.posx, pl.posy], name: pl.name, style: {r: 8, fill: 'yellow'}};
//                markers.push(marker);
                //map.addMarker(''+pl.id, marker);
                //$('#world-main').append('ahoj').addClass('place');

            });

    }

    function setupMap(){
        worldFactory.loadPlaces(function(iplaces,placesIds){
            places = iplaces;
            updatePlaces(places);
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
            item  = $('<img id="penguin2" src="assets/img/penguin/penguin_3.png"/>');
            item.appendTo(jQuery('#world-main'));
        }

        item.css({top: v.y-30, left: v.x-18});




    }


    function moveToPlace(place){
        $location.path('/wordstest/'+place.id);
        var what = '';
        if(worldFactory.game().fly < place.fly){
            what = $translate.instant('fly');
            $('#game_resources_fly').css({color:'red'});
        } else if(worldFactory.game().swim < place.swim){
            what = $translate.instant('swim');
            $('#game_resources_swim').css({color:'red'});
        } else if(worldFactory.game().walk < place.walk){
            $('#game_resources_walk').css({color:'red'});
        } else {
            $scope.$apply(function(){


                worldFactory.setPlace(place);

                showPenguin();
                worldFactory.setupPlacesDistancesAndExp();
                worldFactory.update($scope);

                //testEndGame();
                //element.hide();

            })
            mixpanel.track("Place", {placeId: place.id});
        }

        if(what){
            alertify.error($translate.instant('not_enought', {have:worldFactory.game().walk, need: place.walk, what: what}));
        }
    }


    function testEndGame(){
        if(!worldFactory.testEndGame()){
            //alertify.alert('Game over!');
            $location.path('/gameover');

        }
    }

    function onViewportChange(e1,imap){
        if(!map){
            map = imap;
            setupMap();
        } else if(places) {
            updatePlaces(places);
            showPenguin();

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

            },onMarkerLabelShow: function(event, label, index){
                var h = label.html();
                label.html('aoooj');

                //alert(h);

                //e1.preventDefault();
//                e2[0].text('ahoj');
//                e2.text('ahoj');
                var place = worldFactory.getCurrentPlace();
//                var item  = $('<span />');
//                item.appendTo(element);
//
                var popovers= $('.jvectormap-marker');
                popovers.forEach(function(p){
                    p.popover({trigger:'hover',html:true,title:place.name,content:function(){
                        return self.generateInfo(place);
                    }});
                });

                //event.target.css({top: 20, left: 20});
            },onViewportChange : onViewportChange,
            backgroundColor: '#207cca',
            borderColor: '#000',
            borderOpacity: 0.9,
            borderWidth: 30,
            color: '#f4fff0',
            markersSelectable: true,
            markersSelectableOne: true,
            focusOn: {
                x: 0.5,
                y: -0.39,
                scale: 3
            },map: 'world_mill_en',series: {
                regions: [{
                    values: {
                        "CZ":'#0b4e00',
                        "NZ":'#0b4e00'
                    }
                }]
            }});
    });


}


function WordsTestCtrl($scope, $http, $routeParams, vocabularyFactory, worldFactory, $interval, $location, $translate){

    var BUTTON_STATUS_NORMAL = 0;
    var BUTTON_STATUS_SELECT = 1;
    var BUTTON_STATUS_CORRECT = 2;
    var BUTTON_STATUS_WRONG = 3;

    var GAME_TIME = 90;

    $scope.correct = 100;
    $scope.user_answer = '';

    $scope.correctInRow = 0;
    if(DEBUG_PENGUIN){
        GAME_TIME = 20;
        $scope.correctTotal = 30;
        $scope.correctInRowScore = [1,1,1,1,1];
        $scope.fastAnswerScore = [1,1,1];
    } else {
        $scope.correctTotal = 0;
        $scope.correctInRowScore = [0,0,0,0,0];
        $scope.fastAnswerScore = [0,0,0];
    }




    $scope.wrong = 0;
    $scope.timer = GAME_TIME;

    $scope.user_answered = 0;
    // TODO: detect if user have been here before
    $scope.first_time_visit = 1;

    var lastAnswer = new Date().getTime();


    $scope.score = {
        fly : 1,
        swim : 2,
        walk : 1,
        exp : 0
    }


    var placeid = $routeParams.placeid;

    $scope.part = 0;

    worldFactory.loadPlace(placeid, function(place){
        $scope.place = place;
        //startVocabularyTest();
        //showIntroduction();
        //showConclusion();
        if(DEBUG_PENGUIN){
            //showIntroduction();
            //startVocabularyTest();
            //showIntroduction();
            //showConclusion();
            showQuestion();
        } else {
            // **** DONT CHANGE HERE ****
            showIntroduction();
            // **************************
        }

    });

    /**
     * have to be call after place loaded
     */
    function showQuestion(){

        $scope.part = 3;

        var haveAtleastOneQuestionWithAnswer = $scope.place.questions.some(function(q){
            // could happen the question is null, because is not translated to player-native-language
            return q && q.question && q.answers;
        });

        if(haveAtleastOneQuestionWithAnswer){
            do {
                var pos = worldFactory.getRandomNumber('question_place_'+placeid, $scope.place.questions.length);
                var answers = $scope.place.questions[pos].answers;

                // in some languages can answer missing
                if(answers){
                    $scope.questionText = $scope.place.questions[pos].question;
                    $scope.questionAnswers = answers.split(';');
                }
                // could happend the quesiton is not translanted
                // like above (because is not translated to player-native-language)
                // generate random question till you reach the question
                // with question-text and questionAnswers
            } while(!$scope.questionText || !$scope.questionAnswers);
        } else {
            showConclusion();
        }

        showRandomBackground();
    }

    function showIntroduction(){
        $scope.part = 0;
        showRandomBackground();

    }

    function showConclusion(){
        var game = worldFactory.game();
        $scope.part = 4;
        $scope.score.walk = Math.round(($scope.correctTotal)/8);
        $scope.score.swim = Math.round(
            $scope.correctInRowScore[0]/3
            +  $scope.correctInRowScore[1]/2
            +  $scope.correctInRowScore[2]
            +  $scope.correctInRowScore[3]*2.5
            +  $scope.correctInRowScore[4]*5.5);

        $scope.score.fly = Math.round(
            $scope.fastAnswerScore[0] / 4
            + $scope.fastAnswerScore[1] /3
            + $scope.fastAnswerScore[2] /2);

        $scope.score.exp = Math.round(Math.floor($scope.user_answered/2) * 2 + $scope.first_time_visit);

        var stats = worldFactory.getStats();
        stats.correct += $scope.correctTotal;
        stats.wrong += $scope.wrong;
        stats.walkTotal += $scope.score.walk;
        stats.swimTotal += $scope.score.swim;
        stats.flyTotal += $scope.score.fly;
        stats.expTotal += $scope.score.exp;
        stats.user_answered += Math.floor($scope.user_answered/2);

        $scope.correctInRowScore.forEach(function(cirs, idx){
            stats.correctInRowScore[idx] += cirs;
        });

        $scope.fastAnswerScore.forEach(function(fas, idx){
            stats.fastAnswerScore[idx] += fas;
        });

        var mixdata = {
            correct:$scope.correctTotal,
            wrong:$scope.correctTotal,
            'correctInRowScore[0]' : $scope.correctInRowScore[0],
            'correctInRowScore[1]' : $scope.correctInRowScore[1],
            'correctInRowScore[2]' : $scope.correctInRowScore[2],
            'correctInRowScore[3]' : $scope.correctInRowScore[3],
            'correctInRowScore[4]' : $scope.correctInRowScore[4],
            'fastAnswerScore[0]' : $scope.fastAnswerScore[0],
            'fastAnswerScore[1]' : $scope.fastAnswerScore[1],
            'fastAnswerScore[2]' : $scope.fastAnswerScore[2],
            'score.walk' : $scope.score.walk,
            'score.swim' : $scope.score.swim,
            'score.fly' : $scope.score.fly,
            'score.exp' : $scope.score.exp,
            'wordTestTime' : stats.wordTestTime,
            travelersTotal: $scope.travelersTotal,
            citiesTotal : $scope.citiesTotal,
            'placesTotal': stats.placesTotal,
            'placesUniq' : game.visited.length,
            placeId : game.placeId,
            lang: game.lang,
            learn: game.learn
        }

        mixpanel.track("conclusion", mixdata);
    }

    function startVocabularyTest(){
        loadOrNext();

        lastAnswer = moment();
        $interval(function(){
            $scope.timer -= 1;
            worldFactory.getStats().wordTestTime+=1;
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


        $('#body').css("background-image", "url("+img+")");
    }


    $scope.visit = function(){
        $scope.part = 1;
        startVocabularyTest();
    }


    function loadOrNext(){
        vocabularyFactory.getVocabularyRandomSet(worldFactory.getLearn(), $translate.use(), function(words){
            $scope.correct = 0;
            $scope.words = words;
            console.log(words.word1)
            updateButtons();

        });
    }

    function countCorrectInRow(){
        var tell = null;


        if($scope.correctInRow > 50){
            $scope.correctInRowScore[4] += 1;
            tell='50';
        } else if($scope.correctInRow == 30){
            $scope.correctInRowScore[3] += 1;
            tell = '30';
        } else if($scope.correctInRow == 15){
            $scope.correctInRowScore[2] += 1;
            tell = '15';
        } else if($scope.correctInRow == 10){
            $scope.correctInRowScore[1] += 1;
            tell = '10';
        } else if($scope.correctInRow == 5){
            $scope.correctInRowScore[0] += 1;
            tell = '5';
        }

        if(tell){
            var ins = $translate.instant('correct_in_row', {correct:tell});
            alertify.success(ins);
        }
    }

    function countFastAnswer(){
        var time = new Date().getTime();
        var diff = time - lastAnswer;
        var name = 0;
        if(diff < 1500){
            name = 3;
        }else if(diff < 2000){
            name = 2;
        } else if(diff < 2500){
            name = 1;
        }

        if(name){
            $scope.fastAnswerScore[name-1] += 1;
            var ins = $translate.instant('correct_fast_' + name);
            alertify.success(ins);
        }

        lastAnswer = new Date().getTime();
    }

    function correctAnswer(){
        $scope.correctTotal+=1;
        $scope.correct+=1;
        $scope.correctInRow+=1;
        countFastAnswer();
        countCorrectInRow();


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
                correctAnswer();
            } else {
                status = BUTTON_STATUS_WRONG;
                $scope.wrong+=1;
                $scope.correctInRow=0;

            }
            // select also second side of buttons with this status
            setStatusButton(side == 0 ? 1 : 0, status);
        }

        console.log(link1,link2,status);


        word.status = status;


        updateButtons();

        if(status == BUTTON_STATUS_CORRECT && $scope.correct == $scope.words.word1.length){
            loadOrNext();
            showRandomBackground();
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


    $scope.answer = function(skip){



        if(!$scope.user_answer){
            return ;
        }

        if(!skip){
            // have to be 2 or 1
            // because 0 - mean the user didn't answer yet
            // any other mean show the area with naswered text
            $scope.user_answered = $scope.questionAnswers.some(function(ans){
                return ans == $scope.user_answer;
            }) ? 2 : 1;


            var game = worldFactory.game();
            var mixdata = {
                placeId : game.placeId,
                lang: game.lang,
                learn: game.learn,
                user_answered: $scope.user_answered,
                user_answer : $scope.user_answer,
                questionAnswers : $scope.questionAnswers,
                questionText : $scope.questionText
            }


            mixpanel.track("answer", mixdata);

        } else {
            // user press button skip
            $scope.user_answered = 1;

            var game = worldFactory.game();
            var mixdata = {
                placeId : game.placeId,
                lang: game.lang,
                learn: game.learn,
                questionText : $scope.questionText
            }


            mixpanel.track("answer_skip", mixdata);
            showConclusion();
        }




    }

    $scope.conclusion = function(){
        showConclusion();

    }

    $scope.backToMap = function(){
        $location.path('/world');
        worldFactory.addScore($scope.score);
    }

    $scope.facebook = function(){
        FB.ui(
            {
                method: 'feed',
                name: 'The Facebook SDK for Javascript',
                caption: 'Bringing Facebook to the desktop and mobile web',
                description: (
                    'A small JavaScript library that allows you to harness ' +
                        'the power of Facebook, bringing the user\'s identity, ' +
                        'social graph and distribution power to your site.'
                    ),
                link: 'www.voc4u.com/penguin/1',
                picture: 'http://www.fbrell.com/public/f8.jpg'
            },
            function(response) {
                if (response && response.post_id) {
                    alert('Post was published.');
                } else {
                    alert('Post was not published.');
                }
            }
        );
    }
}

function GameOverCtrl($scope, worldFactory, $location){
    var stats = worldFactory.getStats();
    $scope.game = worldFactory.game();
    $scope.view = 3;

    $scope.stats = stats;
    $scope.citiesTotal = stats.placesTotal * 1000;

    $scope.wordsTotal = stats.correct * 1000;

    $scope.travelersTotal = (stats.walkTotal + stats.swimTotal + stats.flyTotal) * 1000;

    $scope.TOTAL = $scope.citiesTotal   + $scope.wordsTotal + $scope.travelersTotal;


    $scope.changeView = function(view){
        $scope.view = view;
    }

    $scope.startNewGame = function(){
        $location.path('/intro/1');
    }

    var mixdata = {
        correctTotal:stats.correct,
        wrongTotal:stats.wrong,
        wordsTotal:$scope.wordsTotal,
        TOTAL:$scope.TOTAL,
        travelersTotal: $scope.travelersTotal,
        citiesTotal : $scope.citiesTotal,
        'placesTotal': stats.placesTotal,
        'placesUniq' : $scope.game.visited.length,
        placeId : $scope.game.placeId,
        lang: $scope.game.lang,
        learn: $scope.game.learn,
        'correctInRowScore[0]' : stats.correctInRowScore[0],
        'correctInRowScore[1]' : stats.correctInRowScore[1],
        'correctInRowScore[2]' : stats.correctInRowScore[2],
        'correctInRowScore[3]' : stats.correctInRowScore[3],
        'correctInRowScore[4]' : stats.correctInRowScore[4],
        'fastAnswerScore[0]' : stats.fastAnswerScore[0],
        'fastAnswerScore[1]' : stats.fastAnswerScore[1],
        'fastAnswerScore[2]' : stats.fastAnswerScore[2],
        'walkTotal' : stats.walkTotal,
        'swimTotal' : stats.swimTotal,
        'flyTotal' : stats.flyTotal,
        'expTotal' : stats.expTotal,
        'wordTestTime' : stats.wordTestTime
    }

    mixpanel.track("ganeover", mixdata);



}