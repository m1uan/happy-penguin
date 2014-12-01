/**
 * Created by miuan on 7/10/14.
 */
(function() {
    'use strict';
    var amod = angular.module('milan.levels.search.factory',['ngRoute', 'milan.levels.links.factory']);

    var CACHE = false;
    amod.factory('searchFactory', function($http, linksFactory) {
        var self = {};
        var __foundWords = {}

        function __setupFoundedSentence(foundWords, word){
            var countFoundedWords = 0;



            //resultList.push(__foundWords[word.simple]);
            // if is not founded the found words is empty or null
            if(foundWords && foundWords.length > 0){
                // in word could be possible word from prev search or prev check
                // dont remove it.. and update just by words which they are not included in list
                // example : let say we have word "man's" and the word is linked with "man"
                // after search "man's" we get no results... and we will remove "man" from list..
                if(!word.sentences){
                    word.sentences = []
                }

                // also found words contain something
                foundWords.forEach(function(fw){
                    var contain = word.sentences.some(function(poss){
                        return fw.lid == poss.l;
                    })

                    if(!contain){
                        word.sentences.push({
                            l : fw.lid,
                            s : fw.word,
                            s2 : fw.word2,
                            e : fw.english
                        });
                    }
                });

            } else {
                // could be not null because, maybe is there a linkded word
                if(typeof word.sentences == 'undefined'){
                    word.sentences = null;
                }

            }

            return countFoundedWords;
        }

        function __setupFoundedWordOrSentence(foundWords, word, issentence){
            var countFoundedWords = 0;

            if(issentence){
                return __setupFoundedSentence(foundWords, word);
            }


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
        self.__search = function(lang, words, lang2, cb, properly, sentence){

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

            // CACHE enabled? and
            // in words list could be some words multiple time
            // create list just with uniq words or if you find it
            // in previous founded list, use this data
            words.forEach(function(word){
                // foundwords contain already searched words
                if(CACHE && __foundWords[foundLang][word.simple] &&
                    // if we looking for word it not be taken from cache for sentence
                    // and oppossite
                    // if we looking for sentence don't take from cache what is a word
                    ((!sentence && !__foundWords[foundLang][word.simple].sentence) ||
                        sentence && __foundWords[foundLang][word.simple].sentence)){
                    resCount += __setupFoundedWordOrSentence(__foundWords[foundLang][word.simple], word, sentence);
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

                var fixlang = lang;
                var fixlang2 = lang2;
                var url = '/words/search/'+fixlang+'/'+fixlang2+'/?fields=lid,desc,word,word2,english,usage&words='+wordString;

                // dont look properly for words which
                // they are very short (lengyh 3 is minimum)
                // if sentence have to search word between words...
                if(sentence || (properly && minLength >= 3)){
                    url += '&properly=true';
                }

                if(sentence){
                    url += '&sentenceOnly=true';
                }

                requestGET($http, url, function(response, status){
                    console.log(response);



                    response.forEach(function(foundedWords, idx){
                        var wl = workListLinearForSearch[idx];
                        __foundWords[foundLang][wl[0].simple] = foundedWords;
                        // recognize sentence or word,
                        // otherwise when you will finding a word and than sentence for this word
                        // you got the same result from cache
                        __foundWords[foundLang][wl[0].simple].sentence = sentence;
                        wl.forEach(function(word){
                            resCount += __setupFoundedWordOrSentence(foundedWords, word, sentence);
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


        function __removeFromFoundWords(word){
            for(var lang in __foundWords){
                __foundWords[lang][word] = undefined;
            }
        }

        return {
            search : self.__search,
            removeFromFoundWords : __removeFromFoundWords

        };
    });
}).call(this);