/**
 * Created by miuan on 7/10/14.
 */
(function() {
    'use strict';
    var penguinGame = angular.module('milan.levels.links.factory',['ngRoute']);

    penguinGame.factory('linksFactory', function($http) {

        var __links = {};

        function __setupWord(linedWord, word){
            // have to be a array of founded words
            // for continuity with search where could be
            // for one words more possible
            word.possible = [linedWord];
        }

        function __get(lang, words, cb){
            if(!__links[lang]) {
                __links[lang] = {};
            }

            var downloadList = {}
            var downloadListLinks = [];

            words.forEach(function(word){
               if(word.link){
                   // word already donwloaded in list
                   if(__links[word.link]){
                       __setupWord(__links[word.link], word);
                   } else if(downloadList[word.link]) {
                       // link already is in download list
                       // add another word who is care
                       // about this link as well
                       downloadList[word.link].push(word);
                   } else {
                       // link is not in download list
                       // add him and also update download list links
                       downloadList[word.link] = [word];
                       // put the download list array
                       // after download will be all the words in this
                       // array (downloadList[word.link]) given downloaded word
                       downloadListLinks.push(downloadList[word.link])
                   }
               }

            });

            if(downloadListLinks && downloadListLinks.length){
                var wordString = '';
                downloadListLinks.forEach(function(wl){
                    // in downloadlinks have each links array with similar words
                    // with the same link
                    wordString += ',' + wl[0].link;
                });
                wordString = wordString.substring(1);

                var fixlang = lang != 'cz' ? lang : 'cs';
                requestGET($http, '/words/links/'+fixlang+'/?fields=lid,desc,word,english,usage&links='+wordString, function(response, status){
                    console.log(response);

                    response.forEach(function(linkedWord, idx){
                        var wl = downloadListLinks[idx];

                        __links[lang][wl[0].link] = linkedWord;
                        wl.forEach(function(word){
                            __setupWord(linkedWord, word);
                        })
                    });


                    cb();
                });
            } else {
                cb();
            }

        }

        function __update(lang, word){
            if(!__links[lang]) {
                __links[lang] = {};
            }

            __links[lang][word.link] = word;
        }

        return {
            get: __get,
            update : __update
        };
    });
}).call(this);