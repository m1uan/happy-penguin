/**
 * Created by miuan on 7/10/14.
 */
(function() {
    'use strict';
    var amod = angular.module('milan.levels.search.factory',['ngRoute', 'milan.levels.links.factory']);

    amod.factory('searchFactory', function($http, linksFactory) {
        var self = {};
        var __foundWords = {}

        function __setupFoundedWord(foundWords, word){
            var countFoundedWords = 0;

            //resultList.push(__foundWords[word.simple]);
            // if is not founded the found words is empty or null
            if(foundWords && foundWords.length > 0){

                // when is check button pressed access new lid to link
                // but in search shoud not be accessed without human know
                // so if possible doesn't have any data its probably first check
                // and could be updated link if is some
                if(!word.possible || word.possible.length < 1){
                    word.link = foundWords[0].lid;
                }


                // in word could be possible word from prev search or prev check
                // dont remove it.. and update just by words which they are not included in list
                // example : let say we have word "man's" and the word is linked with "man"
                // after search "man's" we get no results... and we will remove "man" from list..
                if(word.possible && word.possible.length > 0){
                    // also found words contain something
                   foundWords.forEach(function(fw){
                       var contain = word.possible.some(function(poss){
                            return fw.lid == poss.lid;
                       })

                       if(!contain){
                           word.possible.push(fw);
                       }
                    });
                } else {
                    // possible is empty
                    word.possible = foundWords;
                }



                countFoundedWords = foundWords.length;
            } else {
                // could be not null because, maybe is there a linkded word
                if(typeof word.possible == 'undefined'){
                    word.possible = null;
                }

            }

            return countFoundedWords;
        }



        /**
         *
         * @param lang - lang for search
         * @param words
         * @param lang2 {String} optional lang for result of words (current.language)
         * @param cb
         * @param reverse {Boolean} read
         * @private
         */
        self.__search = function(lang, words, lang2, cb, properly){

            // classic if the lang2 is not use
            if(!cb){
                cb = lang2;
                lang2 = 'en';
            }

            var foundLang = lang + lang2;


            // first search for this language
            if(!__foundWords[foundLang]) {
                __foundWords[foundLang] = {};
            }

            var workList = [];
            var workListLinearForSearch = [];
            var resultList = [];

            // how much words was founded
            var resCount = 0;


            // in words list could be some words multiple time
            // create list just with uniq words or if you find it
            // in previous founded list, use this data
            words.forEach(function(word){
                // foundwords contain already searched words
                if(__foundWords[foundLang][word.simple]){
                    resCount += __setupFoundedWord(__foundWords[foundLang][word.simple], word);
                } else {
                    // the word is not in found list
                    // if is the same word in list, don't search again
                    // just add link to another word
                    if(workList[word.simple]){
                        // add word to worklist
                        // the word is already in search list
                        workList[word.simple].push(word)
                    } else {
                        workList[word.simple] = [word]
                        // add workList to searchlist
                        workListLinearForSearch.push(workList[word.simple]);
                    }

                }

            });



            // all words could be find in previous searched list
            // test if any words have to by ask server for download data
            if(workListLinearForSearch && workListLinearForSearch.length > 0){
                var wordString = '';
                var minLength = 100;
                workListLinearForSearch.forEach(function(wl){
                    wordString += ',' + wl[0].simple;
                    if(wl[0].simple && minLength > wl[0].simple.length){
                        minLength =  wl[0].simple.length;
                    }
                });
                wordString = wordString.substring(1);

                var fixlang = lang != 'cz' ? lang : 'cs';
                var fixlang2 = lang2 != 'cz' ? lang2 : 'cs';
                var url = '/words/search/'+fixlang+'/'+fixlang2+'/?fields=lid,desc,word,word2,english,usage&words='+wordString;

                // dont look properly for words which
                // they are very short (lengyh 3 is minimum)
                if(properly && minLength >= 3){
                    url += '&properly=true';
                }

                requestGET($http, url, function(response, status){
                    console.log(response);



                    response.forEach(function(foundedWords, idx){
                        var wl = workListLinearForSearch[idx];
                        __foundWords[foundLang][wl[0].simple] = foundedWords;
                        wl.forEach(function(word){
                            resCount += __setupFoundedWord(foundedWords, word);
                        })

                        // update links factory for next load
                        // foundedWords have more links
                        foundedWords.forEach(function(fw){
                            linksFactory.update(lang, fw);
                        })
                    });


                    cb(resCount);
                });
            } else {
                cb(resCount);
            }

        }


        function __removeFromFoundWords(lang, word){
            if(__foundWords[lang]){
                __foundWords[lang][word] = null;
            }
        }

        return {
            search : self.__search,
            removeFromFoundWords : __removeFromFoundWords

        };
    });
}).call(this);