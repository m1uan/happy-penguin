/**
 * Created by miuan on 7/10/14.
 */
(function() {
    'use strict';
    var penguinGame = angular.module('milan.levels.links.factory',['ngRoute']);

    var CACHE = false;
    penguinGame.factory('linksFactory', function($http) {

        var __links = {};
        var __sentences = {}
        var __linkSentences = {}

        function __setupWord(linedWord, word){
            if(!linedWord){
                word.possible = null;
                return;
            }

            // have to be a array of founded words
            // for continuity with search where could be
            // for one words more possible
            word.possible = [linedWord];

            // if you are click on possible word is set up as selected
            // and the button unlink will be appear
            // but if is words loaded from db, selected is not part of their field
            // is it in text[there_is_selected_link] so is supposed all words
            // loaded this method, very probably because they was in these bracked
            word.possible[0].selected = true;

            // from link comming only one side of word
            // word is reserved for english part
            word.word2 = word.word;
            //word.word = null;
        }

        function __get(lang, words, cb, lang2){

            if(!lang2){
                lang2 = 'en';
            }

            var linkslang = lang + lang2;


            if(!__links[linkslang]) {
                __links[linkslang] = {};
            }

            var downloadList = {}
            var downloadListLinks = [];

            words.forEach(function(word){
               if(word.link){
                   // word already donwloaded in list
                   if(CACHE && __links[linkslang][word.link]){
                       __setupWord(__links[linkslang][word.link], word);
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

                var fixlang = lang;
                requestGET($http, '/words/links/'+fixlang+'/'+lang2+'/?fields=lid,desc,word,word2,english,usage&links='+wordString, function(response, status){
                    console.log(response);

                    response.forEach(function(linkedWord, idx){
                        var wl = downloadListLinks[idx];

                        __links[linkslang][wl[0].link] = linkedWord;
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

        function __removeCacheForSentencesToLink(lang, toLink, lang2){
            if(!lang2){
                lang2 = 'en'
            }

            var linkslang = lang + lang2;


            // init __linkSentences for lang
            if(!__linkSentences[linkslang]){
                __linkSentences[linkslang] = {}
            }

            if(!__sentences[linkslang]){
                __sentences[linkslang] = {}
            }

            __linkSentences[linkslang][toLink] = undefined;
            __sentences[linkslang][toLink] = undefined;
        }

        function __getSentenceToLinkCache(lang, toLink, cb, lang2){

            if(!lang2){
                lang2 = 'en'
            }

            var linkslang = lang + lang2;

            // init __linkSentences for lang
            if(!__linkSentences[linkslang]){
                __linkSentences[linkslang] = {}
            }

            if(!__sentences[linkslang]){
                __sentences[linkslang] = {}
            }

            var sentenceLink = __linkSentences[linkslang][toLink];

            if(!sentenceLink){
                return false;
            }


            var cacheSentence = __sentences[linkslang];
            var sentences = [];
            sentenceLink.forEach(function(senLink){
                sentences.push(cacheSentence[senLink]);
            })

            cb(sentences);
            return true;
        }

        function __getSentencesToLink(lang, toLink, cb, lang2){

            if(!lang2){
                lang2 = 'en'
            }

            var linkslang = lang + lang2;

            if(!__getSentenceToLinkCache(lang, toLink, cb, lang2)) {

                __linkSentences[linkslang][toLink] = [];
                requestGET($http, '/words/sentences/'+lang+'/'+lang2+'/?toLinks='+toLink, function(response, status){
                    response.sentences.forEach(function(sen){
                        __sentences[linkslang][sen.l] = sen;
                        __linkSentences[linkslang][toLink].push(sen.l);
                    });

                    __getSentenceToLinkCache(lang, toLink, cb, lang2);
                });
            }



        }

        function __update(lang, word, lang2){
            if(!lang2){
                lang2='en';
            }

            var linkslang = lang + lang2;

            if(!__links[linkslang]) {
                __links[linkslang] = {};
            }

            __links[linkslang][word.link] = word;
        }



        return {
            get: __get,
            update : __update,
            getSentencesToLink : __getSentencesToLink,
            removeCacheForSentencesToLink : __removeCacheForSentencesToLink
        };
    });
}).call(this);