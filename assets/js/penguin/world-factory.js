(function() {
    /* Start angularLocalStorage */
    'use strict';
    var penguinGame = angular.module('milan.world.factory', ['penguin.LocalStorageService']);

    penguinGame.factory('worldFactory', function($http, localStorageService) {
        var BASE = DEBUG_PENGUIN ? 300 : 3;
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

        function _createNewGame(){
            self.game = {
                walk :BASE,
                swim :BASE,
                fly : BASE,
                exp : BASE,
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

            scope.fly = self.game.fly;
            scope.walk = self.game.walk;
            scope.swim = self.game.swim;
            scope.exp = self.game.exp;

            scope.levelInfo = _calcLevelInfo();
            _store();

            return true;
        }


        function _calcLevelInfo(){
            if(!self.game){
                _game();
            }

            // step in levels
            var scores = [75,175,300,450,625,850,1075,1500]

            var levelInfo = {
                level : 1,
                levelExp : self.game.stats.correct,
                baseLevelExp : 0,
                nextLevelExp : 0
            }

            scores.some(function(score, idx){
                if(score > self.game.stats.correct){
                    levelInfo.nextLevelExp = score;
                    return true;
                } else {
                    levelInfo.baseLevelExp = score;
                    levelInfo.level = idx + 1;
                }
            })

            return levelInfo;
        }

        function _place(place){
            self.game.fly -= place.fly;
            self.game.swim -= place.swim;
            self.game.walk -= place.walk;

            // TODO : dont add when already in list
            if(self.game.visited.indexOf(self.game.placeId) == -1){
                self.game.visited.push(self.game.placeId);
            }

            self.game.placeId = place.id;

            self.game.stats.placesTotal += 1;
            _store();

        }

        function _addScore(score){
            self.game.fly += score.fly;
            self.game.swim += score.swim;
            self.game.walk += score.walk;
            self.game.exp += score.exp;

            // maybe useles
            self.game.lastScore = score;
            _store();
        }

        function _store(){
            localStorageService.set('pinguin.game', self.game);
        }


        function loadPlaces(cb){
            if(placesInWorld && placesInWorldIds){
                cb(placesInWorld, placesInWorldIds);
            } else {
                var url ='list/'+self.game.learn+'/'+self.game.native+'/?fields=id,name,posx,posy,size,preview';
                requestGET($http, url, function(response, status){
                    placesInWorld = response;
                    placesInWorldIds = {};


                    placesInWorld.forEach(function(place){
                       placesInWorldIds[place.id] = place;
                    });


                    cb(placesInWorld, placesInWorldIds);
                });
            }
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

                place.fly = Math.floor(place.superDistance / 9);
                place.swim = Math.floor((place.superDistance - (place.fly*6)) / 3);
                place.walk = (place.superDistance - (place.fly*5) - (place.swim*2));
            });

        }


        function testEndGame(){
            var canPlay = placesInWorld.some(function(place){
                if(place.id != self.game.placeId &&  place.fly <= self.game.fly && place.swim <= self.game.swim && place.walk <= self.game.walk){
                    return true;
                } else {
                    return false;
                }
            });

            return canPlay;
        }

        function loadPlace(placeid, cb){
            if(placesForVocabularyTest[placeid]){
                cb(placesForVocabularyTest[placeid]);
                return ;
            }

            var url ='get/'+placeid+'/'+self.game.learn+'/'+self.game.native+'/?fields=id,name,info&qfields=qid,question,answers&ifields=iid,image';
            requestGET($http, url, function(response, status){

                placesForVocabularyTest[placeid] = response;
                cb(response);
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
            ,getRandomNumber: getRandomNumber
            ,addScore:_addScore
            ,setup : setup
            ,getLearn : getLearn
            ,getNative : getNative
            ,getStats : function(){ return _game().stats; }
            };

    });
}).call(this);