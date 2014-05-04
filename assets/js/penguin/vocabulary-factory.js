(function() {
    /* Start angularLocalStorage */
    'use strict';
    var vocabularyFactory = angular.module('milan.vocabulary.factory', ['penguin.LocalStorageService']);

    vocabularyFactory.factory('vocabularyFactory', function($http, localStorageService) {


        return {
           };
    });
}).call(this);