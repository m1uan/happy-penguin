(function() {
    /* Start angularLocalStorage */
    'use strict';
    var penguinGame = angular.module('penguin.game', ['penguin.LocalStorageService']);

    penguinGame.factory('penguinGame', function(localStorageService) {
        var self = this;
        self.game = null;

        function _createNewGame(){
            self.game = {
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

        return {
            createNewGame: _createNewGame
            ,game:_game
            ,update:_update};
    });
}).call(this);