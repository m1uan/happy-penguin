/**
 * Created by miuan on 3/11/14.
 */
(function() {
    /* Start angularLocalStorage */
    'use strict';
    var placeGame = angular.module('milan.place.factory', ['penguin.LocalStorageService']);

    placeGame.factory('placeFactory', function($http, localStorageService, worldFactory,$timeout) {
        var self = {
            place : null
        };

        function __setupPlaceBackground(){

        }

        function _setupPlace(placeId, cb){

            var prevPlace = worldFactory.getCurrentPlace();


            if(prevPlace.id != placeId){

                worldFactory.loadPlaces(function(places, placesIds){
                    self.place = placesIds[placeId];
                    // test if is possible to move
                    if(worldFactory.isPossibleToMoveWithMessage(self.place)){
                        __setupPlaceBackground();
                        // set place and recount distances and prices
                        worldFactory.setPlace(self.place);
                        worldFactory.setupPlacesDistancesAndExp();
                        cb(self.place)
                    } else {
                        // $apply is already in process
                        $timeout(function(){
                            $location.path('/world');
                        }, 1)
                    }
                });
            } else {
                self.place = prevPlace;
                __setupPlaceBackground();
                cb(self.place)
            }


        }

        return {
            setupPlace: _setupPlace};
    });
}).call(this);