(function() {
    // TODO: clear storage for case will be new game
    /* Start angularLocalStorage */
    'use strict';
    var vocabularyFactory = angular.module('milan.vocabulary.factory', ['penguin.LocalStorageService']);

    vocabularyFactory.factory('vocabularyFactory', function($http, localStorageService) {
        var words = [];
        var usedWords = [];
        // set null for detect if is loadet from storage or not
        var wordsIds = null;
        var loadedLessons = [];
        var MAX_IN_SET = 8;
        var CURRENT_WORDS = 1001;

        var LOCALSTORAGE_WORDS = 'pinguin.vocabulary.words';
        var LOCALSTOREGE_USED_WORDS = 'pinguin.vocabulary.used-words';
        var LOCALSTOREGE_LOADED_LESSONS = 'pinguin.vocabulary.loaded-lessons';

        function restoreFactory(cb){
            // if is wodsIds not null it is mean
            // the wordls was loaded from storage
            if(!wordsIds) {
                // remove all
//                localStorageService.set(LOCALSTORAGE_WORDS, null);
//                localStorageService.set(LOCALSTOREGE_USED_WORDS, null);
//                localStorageService.set(LOCALSTOREGE_LOADED_LESSONS, null);
                words = localStorageService.get(LOCALSTORAGE_WORDS) || [];
                usedWords = localStorageService.get(LOCALSTOREGE_USED_WORDS) || [];
                loadedLessons = localStorageService.get(LOCALSTOREGE_LOADED_LESSONS) || [];

                wordsIds = {}
                // part of words is in words
                words.forEach(function(word, idx){
                    wordsIds[word.link] = word;
                });
                // part of words is in usedWords
                usedWords.forEach(function(word, idx){
                    wordsIds[word.link] = word;
                });
            }
        }

        function storeFactory(){
            localStorageService.set(LOCALSTORAGE_WORDS, words);
            localStorageService.set(LOCALSTOREGE_USED_WORDS, usedWords);
            localStorageService.set(LOCALSTOREGE_LOADED_LESSONS, loadedLessons);
        }

        function getWords(lesson, learn, native, cb){
            // restore factory to let know is any lesson loaded
            restoreFactory();

            if(loadedLessons.indexOf(lesson) != -1){
                cb(words, wordsIds);
            } else {

                if(learn == 'cz'){
                    learn = 'cs';
                }

                if(native == 'cz'){
                    native = 'cs';
                }
                // who created this?????
                // >>> not deleted : 1 - show all (not deleted and unaproved)
                // >>>             0 - NOT show deleted files
                requestGET($http, '/words/get/'+lesson+'/'+learn+'/'+native+'?fields=link,word%20as%20w&nd=0&type=api',function(data){
                    data.words.forEach(function(word, idx){
                        words.unshift(word);
                        wordsIds[word.link] = word;
                    });

                    // add to list for control if this lesson already downloaded
                    loadedLessons.push(lesson);

                    // store to storage for let know lesson is loaded
                    storeFactory();

                    /* old version
                    words[lesson] = data.words;
                    wordsIds[lesson] = {};
                    words[lesson].forEach(function(word){
                        wordsIds[lesson][word.link] = word;
                    }); */

                    cb(words, wordsIds);
                });
            }
        }

        function getNextWords(lesson){
            var rw = [];

            // set first time
            if(!usedWords){
                usedWords = [];
            }

            do{
                var w = words.shift();

                // words empty lets use usedWords again
                if(!w){
                    w = usedWords.shift();
                    words = usedWords;
                    usedWords = [];
                }

                rw.push(w);
                usedWords.push(w);


            } while(rw.length < MAX_IN_SET)

            // store to storage for let know
            // usedWord, and words are changed
            storeFactory();

            return rw;
        }

        function getVocabularyRandomSet(lesson, learn, native, cb){
            getWords(lesson, learn, native,  function(w,i){
                var s1 = getNextWords(lesson);

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