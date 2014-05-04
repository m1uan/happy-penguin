(function() {
    /* Start angularLocalStorage */
    'use strict';
    var vocabularyFactory = angular.module('milan.vocabulary.factory', ['penguin.LocalStorageService']);

    vocabularyFactory.factory('vocabularyFactory', function($http, localStorageService) {
        var words = null;
        var wordsIds = null;
        var MAX_IN_SET = 10;

        function getWords(cb){
            if(words){
                cb(words, wordsIds);
            } else {
                requestGET($http, '/words/get/1001/cs/en?fields=link,word%20as%20w&deleted=false&type=api',function(data){
                    words = data.words;
                    wordsIds = {};
                    words.forEach(function(word){
                        wordsIds[word.link] = word;
                    });

                    cb(words, wordsIds);
                });
            }
        }

        function getNextWords(){
            var max = MAX_IN_SET;
            var rw = [];
            words.some(function(w){
                rw.push(w);
                return (max--) == 0;
            });

            return rw;
        }

        function getVocabularyRandomSet(cb){
            getWords(function(w,i){
                var s1 = getNextWords();

                var ret = {};
                ret.word1 = [];
                ret.word2 = [];
                s1.forEach(function(w){
                    var w1 = {
                        word : w.w1,
                        link : w.link
                    }

                    var w2 = {
                        word : w.w2,
                        link : w.link
                    }

                    ret.word1.push(w1);
                    ret.word2.push(w2);
                });

                console.log('ret before rand: ', ret);

                ret.word1= shuffle(ret.word1);
                ret.word2 = shuffle(ret.word2);

                console.log('ret after rand: ', ret);
                cb(ret);

            })
        }

        function numEmpty(words){
            var countEmpty = 0;
            words.forEach(function(w){
                if(w==null){
                    countEmpty++;
                }
            });

            return countEmpty;
        }

        function putToEmptyIndex(words, word, index){
            var countEmpty = 0;
            words.some(function(w, realIndex){
                if(w==null){
                    if(countEmpty == index){
                        words.splice(realIndex, 1, word);
                        return true;
                    }
                    countEmpty++;
                }

                return false;
            });

            return countEmpty;
        }

        function shuffle(words){
            var ret = [];
            words.forEach(function(w){
                ret.push(null);
            });

            words.forEach(function(w){
                var countEmpty = numEmpty(ret);

                var randpos1 = 1;
                if(countEmpty > 1){
                    randpos1 = Math.floor((Math.random() * 1000)) % (countEmpty-1);
                }
                putToEmptyIndex(ret, w, randpos1);
                console.log(countEmpty,randpos1);
            });


            return ret;

        }

        return {
            getVocabularyRandomSet:getVocabularyRandomSet
           };
    });
}).call(this);