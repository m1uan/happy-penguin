(function() {
    /* Start angularLocalStorage */
    'use strict';
    var penguinGame = angular.module('milan.world.factory', ['penguin.LocalStorageService']);

    penguinGame.factory('worldFactory', function($http, localStorageService) {
        var self = this;
        self.game = null;

        var placesInWorld = null;
        var placesInWorldIds = null;

        var placesForVocabularyTest = {};



        function _createNewGame(){
            self.game = {
                fly : 20,
                swim :20,
                walk :20,
                exp : 20,
                lang:'en',
                learn: 'en',
                placeId : 16,
                visited : [],
                randomScenarios : {}
            }



            localStorageService.set('pinguin.game', self.game);

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


            return true;
        }

        function _place(place){
            self.game.fly -= place.fly;
            self.game.swim -= place.swim;
            self.game.walk -= place.walk;
            self.game.visited.push(self.game.placeId);
            self.game.placeId = place.id;
        }

        function _addScore(score){
            self.game.fly += score.fly;
            self.game.swim += score.swim;
            self.game.walk += score.walk;
            // maybe useles
            self.game.lastScore = score;
        }

        function _store(){
            localStorageService.set('pinguin.game', self.game);
        }


        function loadPlaces(cb){
            if(placesInWorld && placesInWorldIds){
                cb(placesInWorld, placesInWorldIds);
            } else {
                var url ='list/en/?fields=id,name,posx,posy';
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
            return placesInWorldIds[self.game.placeId];
        }

        function setupPlacesDistancesAndExp(){
            var gamePlace = getCurrentPlace();

            placesInWorld.forEach(function(place){
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
            var canPlay = placesInWorld.some(function(place){
                return place.id != self.game.placeId &&  place.fly <= self.game.fly && place.swim <= self.game.swim && place.walk <= self.game.walk;
            });

            return canPlay;
        }

        function loadPlace(placeid, cb){
            if(placesForVocabularyTest[placeid]){
                cb(placesForVocabularyTest[placeid]);
                return ;
            }

            var url ='get/'+placeid+'/'+self.game.learn+'/'+self.game.lang+'/?fields=id,name,info&qfields=qid,question,answers&ifields=iid,image';
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
            ,loadPlace:loadPlace,
            getRandomNumber: getRandomNumber};
    });
}).call(this);