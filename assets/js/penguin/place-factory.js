/**
 * Created by miuan on 3/11/14.
 */
(function() {
    /* Start angularLocalStorage */
    'use strict';
    var placeGame = angular.module('milan.place.factory', ['penguin.LocalStorageService']);

    placeGame.factory('placeFactory', function($http, localStorageService) {
        var self = this;
        self.game = null;

        var langs = {};

        function _getLangs(lang, cb){
            if(langs[lang]){
                cb(langs[lang]);
            } else {
                requestGET($http, '/pinguin/game/langs/'+lang+'',function(data){
                    langs[lang] = data;
                    cb(langs[lang]);
                });
            }
        }

        return {
            getLangs: _getLangs};
    });
}).call(this);