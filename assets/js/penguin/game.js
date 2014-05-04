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

            self.game.visited.push(self.game.placeId);
            self.game.placeId = place.id;
        }

        function _store(){
            localStorageService.set('pinguin.game', self.game);
        }

        return {
            createNewGame: _createNewGame
            ,game:_game
            ,update:_update
            ,store:_store
            ,setPlace:_place};
    });
}).call(this);