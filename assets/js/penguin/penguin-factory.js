(function() {
    /* Start angularLocalStorage */
    'use strict';
    var penguinGame = angular.module('milan.penguin.factory', ['penguin.LocalStorageService']);

    penguinGame.factory('penguinFactory', function($http, localStorageService) {
        var self = this;
        self.game = null;

        var langs = {};

        function _getLangs(lang, cb){
            if(langs[lang]){
                cb(langs[lang]);
            } else {
                requestGET($http, '/pinguin/game/langs/'+lang+'?fields=enable',function(data){
                    langs[lang] = data;
                    cb(langs[lang]);
                });
            }
        }

        return {
            getLangs: _getLangs};
    });
}).call(this);