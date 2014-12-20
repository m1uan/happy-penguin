(function() {
    /* Start angularLocalStorage */
    'use strict';
    var penguinGame = angular.module('milan.world.factory', ['penguin.LocalStorageService','pascalprecht.translate']);

    penguinGame.factory('worldFactory', function($http, localStorageService, $translate, $sce, $location) {
        var BASE = DEBUG_PENGUIN ? 100 : 12;
        var MAX_TEST_PER_VISITS = {'sentences':2,'test':3,crosswords:2, quiz: 1}
        var self = this;
        self.game = null;

        var placesInWorld = null;
        var placesInWorldIds = null;

        var cachedPlacesForInfo = {};


        function setup(learnLang, nativeLang){
            var game = _game();
            if(!game){
                // posibble recreate game
                _createNewGame(learnLang, nativeLang)
            } else {
                game.learn = learnLang;
                game.native = nativeLang;
            }

            // if is language changed remove cached places
            // it is mainly because if you are in intro
            // you load sizes for fake language, but after
            // changed learn and native language you want see real place sizes
            // but if is fake language don't care
            if(learnLang && learnLang != 'fake' && nativeLang && nativeLang != 'fake'){
                placesInWorld = null;
                placesInWorldIds = null;
            }

        }

        function _getCoins(){
            return self.game.coins;
        }

        function _createNewGame(learnLang, nativeLang){
            self.game = {
                coins: BASE,
                learn:learnLang,
                native: nativeLang,
                placeId : 1,
                visited : [1],
                placesHistory : { '1' : {countVisit : 1}},
                randomScenarios : {},
                testsCounts : {
                    test : 0,
                    sentences : 0,
                    crosswords : 0,
                    quiz : 0
                },
                stats :{
                    correct : 0,
                    wrong : 0,
                    correctInRowScore : [0,0,0,0,0],
                    fastAnswerScore : [0,0,0],
                    correctInRowCoins : [0,0,0,0,0],
                    fastAnswerCoins : [0,0,0],
                    questionsAnswer : 0,
                    walkTotal : 0,
                    swimTotal :0,
                    flyTotal :0,
                    expTotal : 0,
                    wordTestTime : 0,
                    placesTotal : 0
                }
            }


            // clean words
            localStorageService.set('pinguin.vocabulary.words', null);
            // old version - new version is with pEnguin.game2
            localStorageService.set('pinguin.game', null);
            _store();

            return self.game;
        }

        function _game(){
            if(!self.game){
                self.game = localStorageService.get('penguin.game2');

            }

            return self.game;
        }

        function _store(){
            localStorageService.set('penguin.game2', self.game);
        }

        function _update(scope){
            if(!self.game){
                _game();
            }

            //scope.coins = self.game.coins;
//            scope.fly = self.game.fly;
//            scope.walk = self.game.walk;
//            scope.swim = self.game.swim;
//            scope.exp = self.game.exp;

            scope.levelInfo = _calcLevelInfo();

            //scope.testsCounts = self.game.testsCounts;
            scope.game = self.game;
            _store();

            return true;
        }


        function _calcLevelInfo(){
            if(!self.game){
                _game();
            }

            // step in levels
            var scores = [75,175,300,450,625,850,1075,1400,1750,2000]
            var lessons = [1001,1002,1003,1004,1005,2001,2002,2003,2004,2005,2006,2007,2008]

            var levelInfo = {
                level : 1,
                levelExp : self.game.stats.correct,
                baseLevelExp : 0,
                nextLevelExp : 0
            }

            scores.some(function(score, idx){
                if(score > self.game.stats.correct){
                    levelInfo.nextLevelExp = score;
                    levelInfo.level = idx + 1;
                    levelInfo.lesson = lessons[idx];
                    return true;
                } else {
                    levelInfo.baseLevelExp = score;
                }
            })

            return levelInfo;
        }

        function _place(place){
            self.game.coins -= place.coins;
//            self.game.fly -= place.fly;
//            self.game.swim -= place.swim;
//            self.game.walk -= place.walk;

            if(self.game.visited.indexOf(self.game.placeId) == -1){
                self.game.visited.push(self.game.placeId);
            }

            self.game.placeId = place.id;

            self.game.stats.placesTotal += 1;

            // remember how many times you was visited a single place
            if(!self.game.placesHistory){
                self.game.placesHistory = {}
            }

            if(self.game.placesHistory[place.id] && self.game.placesHistory[place.id].hasOwnProperty('countVisit')){
                self.game.placesHistory[place.id].countVisit += 1;
            } else {
                self.game.placesHistory[place.id] = {
                    countVisit : 1
                };
            }

            place.countVisit = self.game.placesHistory[place.id].countVisit;

            _store();

        }

        function _addScore(score){
            self.game.coins += score.totalCoins;

            // maybe useles
            self.game.lastScore = score;
            _store();

            var infostr = $translate.instant('score_add_info', {golds: score.totalCoins});
            alertify.success(infostr);
        }


        function __separeSourceFromName(place){
            if(place.name){
                var regExp = /\[(.*)\]/;

                // sources[0]: [www.seznam.cz]
                // sources[1]: www.seznam.cz
                var sources = place.name.match(regExp);


                if(sources && sources.length == 2){
                    place.source = sources[1];
                    place.name = place.name.replace(sources[0], '');
                }

            }
        }

        function __setupPlaceWithLastVisit(place, cb){
            if(self.game.placesHistory && self.game.placesHistory[place.id]){
                place.countVisit = self.game.placesHistory[place.id].countVisit;
            } else {
                place.countVisit = 0;
            }
        }

        function loadPlaces(cb){
            if(placesInWorld && placesInWorldIds){
                placesInWorld.forEach(function(place){
                    __setupPlaceWithHistory(place);
                });
                cb(placesInWorld, placesInWorldIds);
            } else {
                var url ='list/'+self.game.learn+'/'+self.game.native+'/?fields=id,name,posx,posy,size,preview';
                requestGET($http, url, function(response, status){
                    placesInWorld = response;
                    placesInWorldIds = {};


                    placesInWorld.forEach(function(place){

                        __setupPlaceWithHistory(place);
                        __separeSourceFromName(place);
                       placesInWorldIds[place.id] = place;
                    });


                    cb(placesInWorld, placesInWorldIds);
                });
            }
        }


        function _isPossibleToMoveWithMessage(place){
            if(self.game.placeId == place.id ||
                self.game.coins >= place.coins) {
                return true;
            }

            $('#game_resources_golds').css({color:'red'});
            alertify.error($translate.instant('not_enought', {have:self.game.coins, need: place.coins}));
            return false;
        }

        function getCurrentPlace(){
            if(placesInWorldIds){
                return placesInWorldIds[self.game.placeId];
            } else {
                return null;
            }

        }

        function _getCurrentPlaceAsync(cb){
            loadPlaces(function(){
                cb(getCurrentPlace());
            })
        }

        function setupPlacesDistancesAndExp(){
            var gamePlace = getCurrentPlace();

            placesInWorld.forEach(function(place){
                var xd = gamePlace.posx - place.posx;
                var yd = gamePlace.posy - place.posy;
                var distance = Math.sqrt((xd*xd)+(yd*yd));
                place.superDistance = Math.round(distance);
                place.coins = place.superDistance;
                //place.fly = Math.floor(place.superDistance / 9);
                //place.swim = Math.floor((place.superDistance - (place.fly*6)) / 3);
                //place.walk = (place.superDistance - (place.fly*5) - (place.swim*2));
            });

        }


        function testEndGame(){
            var canPlay = placesInWorld.some(function(place){
                return(place.id != self.game.placeId &&  place.coins <= self.game.coins);
            });

            return canPlay;
        }

        function __setupPlaceWithHistory(place){
            if(self.game.placesHistory && self.game.placesHistory[place.id]){
                place.history = self.game.placesHistory[place.id];
            } else {
                // for case
                if(!self.game.placesHistory){
                    self.game.placesHistory = {}
                }
                self.game.placesHistory[place.id] = {}
                place.history = self.game.placesHistory[place.id];
            }

        }

        function __generateCountOfLeftHistoryKey(place, name){
            if(place.history.countVisit == undefined){
                place.history.countVisit = 0;
            }

            return name + place.history.countVisit;
        }

        function _getPlaceHistoryValue(place, name){
            var countVocTest = __generateCountOfLeftHistoryKey(place,name);
            return self.game.placesHistory[place.id][countVocTest] || 0;
        }

        function _putPlaceHistoryValue(place, name, value){
            var countVocTest = __generateCountOfLeftHistoryKey(place, name);
            if(self.game.placesHistory[place.id][countVocTest] == undefined){
                self.game.placesHistory[place.id][countVocTest] = value;
            } else {
                self.game.placesHistory[place.id][countVocTest] = value;
            }

            _store();
        }

        function _redirectToInfoIsTestsUnlockedWithAlert(place){
            var unlocked = _getPlaceHistoryValue(place, 'info');

            if(!unlocked){
                var mess = $translate.instant('places-test-still-locked');
                alertify.alert(mess);
                $location.path('/info');
            }


            return unlocked;
        }

        function _testIsAlowedATest(testName, startTestCB){

            _getCurrentPlaceAsync(function(place){
                // for case the user not yet visit a info
                // to unlock place's test -> redirect him to info
                if(_redirectToInfoIsTestsUnlockedWithAlert(place)) {
                    // test if the test was not run so offten
                    var repeats = self.game.testsCounts[testName];
                    if(repeats < 1){
                        var mess = $translate.instant('voc-test-limit-test-max', {count:MAX_TEST_PER_VISITS[testName]});
                        alertify.alert(mess);
                        $location.path('/map')
                    } else {
                        startTestCB(place, repeats);
                    }
                }
            });
        }


        function loadPlace(placeid, cb){
            var learn = self.game.learn;

            if(!learn || learn == 'fake'){
                learn = 'en';
            }

            // add native into place id,
            // because first time when user not choice the learn language
            // show to him a 'fake' info (info in english)
            // but after he choice (for example spain) the learn lang
            // give him new info with spain not again eng
            var cacheId = placeid + '-' + learn;

            if(cachedPlacesForInfo[cacheId]){
                __setupPlaceWithHistory(cachedPlacesForInfo[cacheId])
                cb(cachedPlacesForInfo[cacheId]);
                return ;
            }

            var url ='get/'+placeid+'/'+learn+'/'+self.game.native+'/?fields=id,name,info,info_native&qfields=qid,question,answers,type&ifields=iid,image';
            requestGET($http, url, function(response, status){
                __separeSourceFromName(response);



                cachedPlacesForInfo[cacheId] = response;
                __setupPlaceWithHistory(cachedPlacesForInfo[cacheId]);
                cb(cachedPlacesForInfo[cacheId])
            });
        }

        /**
         * get random numbers for specified scenarios images, questions
         * key is for ensure it will be not generate the same random number
         * for similar scenario
         * @param scenario - identifier of scenario
         * @param max - max for this number
         */
        function getRandomNumber(scenario, max){
            if(!self.game.randomScenarios){
                self.game.randomScenarios = {};
            }

            var lastRandom = self.game.randomScenarios[scenario];
            var rand = -1;
            if(max < 2){
                return 0;
            }

            do {
                if(max >= 3){
                    rand = Math.floor((Math.random() * 1000)) % (max);
                } else {
                    rand ++;
                }

            }while(lastRandom == rand);



            self.game.randomScenarios[scenario] = rand;
            return rand;
        }

        function getLearn(){
            _game();
            return self.game ? self.game.learn : null;
        }

        function getNative(){
            _game();
            return self.game ? self.game.native : null;
        }

        return {
            createNewGame: _createNewGame
            ,game:_game
            ,update:_update
            ,store:_store
            ,setPlace:_place
            ,loadPlaces : loadPlaces
            ,setupPlacesDistancesAndExp: setupPlacesDistancesAndExp
            ,testEndGame:testEndGame
            ,getCurrentPlace: getCurrentPlace
            ,loadPlace:loadPlace
            ,isPossibleToMoveWithMessage : _isPossibleToMoveWithMessage
            ,getRandomNumber: getRandomNumber
            ,addScore:_addScore
            ,setup : setup
            ,getLearn : getLearn
            ,getNative : getNative
            ,getStats : function(){ return _game().stats; }
            ,calcLevelInfo : _calcLevelInfo
            ,getCoins : _getCoins
            ,getCurrentPlaceAsync : _getCurrentPlaceAsync
            ,putCountOfLeftToPlaceHistory: _putPlaceHistoryValue
            ,getCountOfLeftToPlaceHistory : _getPlaceHistoryValue
            ,redirectToInfoIsTestsUnlockedWithAlert: _redirectToInfoIsTestsUnlockedWithAlert
            ,testIsAlowedATest : _testIsAlowedATest
            ,MAX_TEST_PER_VISITS : MAX_TEST_PER_VISITS
        };

    });
}).call(this);