(function() {
    /* Start angularLocalStorage */
    'use strict';
    var vocabularyFactory = angular.module('milan.vocabulary.factory', ['penguin.LocalStorageService']);

    vocabularyFactory.factory('vocabularyFactory', function($http, localStorageService) {
        var words = [];
        var usedWords = [];
        var wordsIds = [];
        var MAX_IN_SET = 8;
        var CURRENT_WORDS = 1001;


        function getWords(lesson, cb){
            if(words[lesson]){
                cb(words[lesson], wordsIds[lesson]);
            } else {
                requestGET($http, '/words/get/'+lesson+'/cs/en?fields=link,word%20as%20w&deleted=false&type=api',function(data){
                    words[lesson] = data.words;
                    wordsIds[lesson] = {};
                    words[lesson].forEach(function(word){
                        wordsIds[lesson][word.link] = word;
                    });

                    cb(words[lesson], wordsIds[lesson]);
                });
            }
        }

        function getNextWords(lesson){
            var rw = [];

            // set first time
            if(!usedWords[lesson]){
                usedWords[lesson] = [];
            }

            do{
                var w = words[lesson].shift();

                // words empty lets use usedWords again
                // TODO: implement load next lang
                if(!w){
                    w = usedWords[lesson].shift();
                    words[lesson] = usedWords[lesson];
                    usedWords[lesson] = [];
                }

                rw.push(w);
                usedWords[lesson].push(w);
            } while(rw.length < MAX_IN_SET)

            return rw;
        }

        function getVocabularyRandomSet(cb){
            getWords(CURRENT_WORDS, function(w,i){
                var s1 = getNextWords(CURRENT_WORDS);

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

                var randpos1 = 0;
                if(countEmpty > 1){
                    randpos1 = Math.floor((Math.random() * 1000)) % (countEmpty);
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