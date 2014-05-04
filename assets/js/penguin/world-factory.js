(function() {
    /* Start angularLocalStorage */
    'use strict';
    var penguinGame = angular.module('milan.world.factory', ['penguin.LocalStorageService']);

    penguinGame.factory('worldFactory', function($http, localStorageService) {
        var self = this;
        self.game = null;

        var places = null;
        var placesIds = null;

        function _createNewGame(){
            self.game = {
                fly : 20,
                swim :20,
                walk :20,
                exp : 20,
                lang:'en',
                learn: 'en',
                placeId : 16,
                visited : []
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

        function _store(){
            localStorageService.set('pinguin.game', self.game);
        }


        function loadPlaces(cb){
            if(places && placesIds){
                cb(places, placesIds);
            } else {
                var url ='list/en/?fields=id,name,posx,posy';
                requestGET($http, url, function(response, status){
                    places = response;
                    placesIds = {};


                    places.forEach(function(place){
                       placesIds[place.id] = place;
                    });


                    cb(places, placesIds);
                });
            }
        }


        function getCurrentPlace(){
            return placesIds[self.game.placeId];
        }

        function setupPlacesDistancesAndExp(){
            var gamePlace = getCurrentPlace();

            places.forEach(function(place){
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
            var canPlay = places.some(function(place){
                return place.id != self.game.placeId &&  place.fly <= self.game.fly && place.swim <= self.game.swim && place.walk <= self.game.walk;
            });

            return canPlay;
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
            ,getCurrentPlace: getCurrentPlace};
    });
}).call(this);