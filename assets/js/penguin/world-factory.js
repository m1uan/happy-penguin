(function() {
    /* Start angularLocalStorage */
    'use strict';
    var penguinGame = angular.module('milan.world.factory', ['penguin.LocalStorageService','pascalprecht.translate']);

    penguinGame.factory('worldFactory', function($http, localStorageService, $translate, $sce) {
        var BASE = DEBUG_PENGUIN ? 100 : 10;
        var self = this;
        self.game = null;

        var placesInWorld = null;
        var placesInWorldIds = null;

        var placesForVocabularyTest = {};

        var learn = 'en';
        var native = 'cz';

        function setup(_learn, _native){
            learn = _learn;
            native = _native;
        }

        function _getCoins(){
            return self.game.coins;
        }

        function _createNewGame(){
            self.game = {
                coins: BASE,
                learn:learn,
                native: native,
                placeId : 1,
                visited : [],
                randomScenarios : {},
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



            _store();

            return self.game;
        }

        function _game(){
            if(!self.game){
                self.game = localStorageService.get('pinguin.game');
            }

            return self.game;
        }

        function _update(scope){
            if(!self.game){
                _game();
            }

            scope.coins = self.game.coins;
//            scope.fly = self.game.fly;
//            scope.walk = self.game.walk;
//            scope.swim = self.game.swim;
//            scope.exp = self.game.exp;

            scope.levelInfo = _calcLevelInfo();
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

            if(self.game.placesHistory[place.id]){
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

        function _store(){
            localStorageService.set('pinguin.game', self.game);
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
                place.history = {};
            }

        }


        function loadPlace(placeid, cb){
            if(placesForVocabularyTest[placeid]){
                __setupPlaceWithHistory(placesForVocabularyTest[placeid])
                cb(placesForVocabularyTest[placeid]);
                return ;
            }

            var url ='get/'+placeid+'/'+self.game.learn+'/'+self.game.native+'/?fields=id,name,info,info_native&qfields=qid,question,answers,type&ifields=iid,image';
            requestGET($http, url, function(response, status){
                __separeSourceFromName(response);

                if(response.info){
                    // ng-sanitary for bind as html
                    // https://docs.angularjs.org/api/ngSanitize/service/$sanitize
                    //response.info = $sce.trustAsHtml(response.info.replace(/(?:\r\n|\r|\n)/g, '<br />'));
                }

                if(response.info_native){
                    // ng-sanitary for bind as html
                    // https://docs.angularjs.org/api/ngSanitize/service/$sanitize
                    //response.info_native = $sce.trustAsHtml(response.info_native.replace(/(?:\r\n|\r|\n)/g, '<br />'));
                }

                placesForVocabularyTest[placeid] = response;
                __setupPlaceWithHistory(placesForVocabularyTest[placeid]);
                cb(placesForVocabularyTest[placeid])
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
            return learn;
        }

        function getNative(){
            return native;
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
            };

    });
}).call(this);