(function() {
    /* Start angularLocalStorage */
    'use strict';
    var penguinGame = angular.module('penguin.game', ['penguin.LocalStorageService']);

    penguinGame.factory('penguinGame', function(localStorageService) {
        function _createNewGame(){
            var game = {
                fly : 20,
                swim :20,
                walk :20,
                exp : 20,
                lang:'en',
                learn: 'en',
                posx: 0.525925925925926,
                posy: 0.224296287254051,
                placeId : 6,
                visited : []
            }



            localStorageService.set('pinguin.game', game);

            return game;
        }

        return {
            createNewGame: _createNewGame()};
    });
}).call(this);