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

        var MAX_INT = 9007199254740992;

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

        function getFirstWordOrSentenceFromUsedWords(sentencesOnly){
            var word = null, index;

            words.some(function(w,idx){
                if((sentencesOnly && w.sentence) || (!sentencesOnly && !w.sentence)){
                    index = idx;
                }

                return word;
            })

            // clean from words and put to end
            if(word){
                words.splice(index, 1);
                words.push(word);
            }


            return word;
        }

        function getNextWords(lesson, sentencesOnly){
            if(!words){
                restoreFactory();
                if(!words || words.length < 1){
                    // it seems now word for dealing with
                    return null;
                }
            }

            var rw = [];
            do{
                var w = getFirstWordOrSentenceFromUsedWords(sentencesOnly);
                rw.push(w);
            } while(rw.length < MAX_IN_SET)

            // store to storage for let know
            // usedWord, and words are changed
            storeFactory();

            return rw;
        }

        function getVocabularyRandomSet(lesson, learn, native, cb){
            var ret = {};
            ret.word1 = [];
            ret.word2 = [];

            var s1 = getNextWords(lesson, false);
            if(!s1){
                cb(ret);
            }

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

            ret.word1 = shuffle(ret.word1);
            ret.word2 = shuffle(ret.word2);

            console.log('ret after rand: ', ret);
            cb(ret);

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

        function __addToTrain(word, sentence){
            restoreFactory();
            var founded = false;
            usedWords.some(function(uw, idx){
                if(uw.link == word.lid){
                    founded = true;
                    uw.weight1 = 1;
                    uw.weight2 = 1;
                }

                return founded;
            })

            if(!founded){
                var nw = {
                    link:word.lid,
                    w1:word.word2,
                    w2:word.word,
                    weight1:1,
                    weight2:1,
                    sentence : sentence
                }
                usedWords.unshift(nw);
            }

            storeFactory();
        }

        /**
         *
         * @param sentenceOnly {Boolean} - true -only sentences opossite only words
         * @returns {Array}
         */
        function getTrainWords(sentencesOnly){

            var trainWords = [];

            // if user didn't visit any place
            // -- refresh page and go straight to train --
            // the words could be not restored from storage
            restoreFactory();

            var testWordsArray = words.concat();

            testWordsArray.sort(function(w1,w2){
                // detect which weight from which word is taken
                // if is weightX is not defined setup to 0
                var ww1 = (w1.testSide == 0 ? w1.word.weight1 : w1.word.weight2);
                var ww2 = (w2.testSide == 0 ? w2.word.weight1 : w2.word.weight2);

                // sort ascending (http://www.w3schools.com/jsref/jsref_sort.asp)
                return ww1 - ww2;
            });

            testWordsArray.some(function(word, idx){
                // if sentences Only take only sentences
                // if words only (sentencesOnly is false or undefined) take only words
                if((sentencesOnly && word.sentence) || (!sentencesOnly && !word.sentence)){
                    var trainWord = generateTrainWordFromWord(word);
                    trainWords.push(trainWord);
                }
                return trainWords.length == 28;
            })



            return trainWords;
        }

        function generateTrainWordFromWord(word){
            // setup word which is first time
            // used for test words
            if(!word.weight1 || !word.weight2){
                // the fist set up is 5 because if the user
                // choice "5" the word get weight 1
                // and in getTrainWords will be fist words
                // which user dosn't know than new words
                word.weight1 = 5;
                word.weight2 = 5;
            }

            // make desision which side of word have to be test
            // if weight1 is less than weight2 -> means user is more sure with weight2
            // so test him from weight1 or opposite
            var testSide;
            if(word.weight1 == word.weight2){
                // random side for words which they have same waight
                // basicaly words what have not presented user yet
                testSide = Math.round(Math.random() *100) >= 50 ? 0 : 1;
            } else if(word.weight1 < word.weight2){
                // test with w1
                testSide = 0;
            } else {
                //test with w2
                testSide = 1;
            }
            return {
                word : word,
                testSide : testSide
            }
        }

        function trainNext(trainWord, know){
            var word = trainWord.word;
            var newWeight = 1;

            if(trainWord.testSide == 0){
                newWeight = word.weight1;
            } else {
                newWeight = word.weight2;
            }

            // count new weight
            if(know == 1){
                newWeight = MAX_INT;
            } else if(know == 3){
                newWeight += 1;
            } else {
                // must be "1" because "0" will let setup word
                // in function generateTrainWordFromWord
                newWeight = 1;
            }

            if(trainWord.testSide == 0){
                word.weight1 = newWeight;
                // user before choice "know for sure"
                // but now from second side he doesn't know so well
                // reset prev side also for show to him atleast one time more
//                if(word.weight2 == MAX_INT){
//                    word.weight2 -= 1;
//                }
            } else {
                word.weight2 = newWeight;
                // user before choice "know for sure"
                // but now from second side he doesn't know so well
                // reset prev side also for show to him atleast one time more
//                if(word.weight1 == MAX_INT){
//                    word.weight1 -= 1;
//                }
            }

            // remove from usedWords if have both side
            // MAX_INT -> thats mean user click "know for sure"
            // on both sides and he know word well
            // and we don't want present to him this word again
            // and meake him boring
            var a1 = word.weight1 >= MAX_INT;
            var a2 = word.weight2 >= MAX_INT;
            if(a1 && a2){
                var position = -1;
                var found = usedWords.some(function(usedWord,idx){
                    position = idx;
                    return word.id == usedWord.id;
                });

                // removed from usedWord because "usedWords"
                // are used for generate train word list
                if(found){
                    usedWords.splice(position,1);
                }
            }



            // store factory for any case
            storeFactory();

        }

        /**
         * NOTE: is not call restoreFactory() so could return false
         * @returns {boolean}
         */
        function isPossibleTrain(){
            return usedWords.length >= 28;
        }


        return {
            getVocabularyRandomSet:getVocabularyRandomSet,
            getTrainWords : getTrainWords,
            trainNext : trainNext,
            isPossibleTrain : isPossibleTrain,
            addToTrain : __addToTrain
           };
    });
}).call(this);