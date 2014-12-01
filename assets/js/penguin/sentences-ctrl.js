function SentencesCtrl($scope, vocabularyFactory, worldFactory, $interval){
    var NUM_WORDS_SET = 3;
    var bonusInterval = null;
    var SENTENCES ;
    var BONUS_TIME0 = 3;
    var BONUS_TIME1 = 10;
    var BONUS_PART0_1 = 1;
    var BONUS_PART0_2 = 2;
    var BONUS_PART1_1 = 2;
    var BONUS_PART1_2 = 5;

    if(DEBUG_PENGUIN){
        BONUS_TIME0 = 10;
        BONUS_TIME1 = 30;
    }

    vocabularyFactory.getVocabularyRandomSet(NUM_WORDS_SET, true, function(sentences){
        SENTENCES = sentences;
        $scope.score = 0;
        //firstCall();
        secondCall();
    }, true)


    function setupCall(part, time, coins, bonus1, bonus2){
        $scope.finish = false;
        $scope.showResult = false;
        $scope.part = part;
        $scope.mistake = false;
        $scope.coins = coins;
        $scope.bonus1 = bonus1;
        $scope.bonus2 = bonus2;

        $scope.random = worldFactory.getRandomNumber('sentence-test', 3);
        $scope.sentenceTop = SENTENCES.word2[$scope.random];

        $('#parts').fadeIn(function(){
            startBonusInterval(time);
        });

    }


    function firstCall(){
        $scope.sentenceChoice = SENTENCES.word1;

        setupCall(0, BONUS_TIME1, 1, BONUS_PART0_1, BONUS_PART0_2);
    }

    function secondCall(){
        setupCall(1, BONUS_TIME1, 2, BONUS_PART1_1, BONUS_PART1_2);

        secondCallPrepareWords();
    }

    function secondCallPrepareWords(){
        var words = SENTENCES.word1[$scope.random].word.trim().split(' ');
        $scope.part1Corect = [];
        $scope.dragWords = [];
        $scope.dropedWords = [];

        var maxIndex = 0;

        words.forEach(function(word,idx){
            var w = capitaliseFirstLetterAndRemoveDots(word);
            $scope.part1Corect.push(w);
            $scope.dragWords.push({word:w,index:idx,correct:true});
            maxIndex = idx;
        });

        part1addAnotherWords(maxIndex);

        $scope.dragWords = vocabularyFactory.shuffle($scope.dragWords)
    }

    function capitaliseFirstLetterAndRemoveDots(string)
    {
        return string.charAt(0).toUpperCase() + string.replace(/\.$/, '').slice(1);
    }

    function part1searchSameItemInDropAndDragListAndRemove(list, index, remove){
        var found = -1;
        list.some(function(w,idx){
            if(w.index == index){
                found = idx;
                return true;
            }
        })

        if(found > -1 && remove){
            list.splice(found, 1);
        }

        return found;
    }

    function part1addAnotherWords(){
        var lastIndex = $scope.dragWords.length;
        var added = 0;
        // scan all sentences
        SENTENCES.word1.some(function(sentences){
            // scan all words in sentences
            return sentences.word.trim().split(' ').some(function(word){
                // search if world is not already contained
                var w = capitaliseFirstLetterAndRemoveDots(word);
                var alreadyInList = $scope.dragWords.some(function(searchWord){
                    return searchWord.word == w;
                })

                // is not in list so add this
                if(!alreadyInList){
                    $scope.dragWords.push({word:w,index:lastIndex++})
                    added++;
                }

                return added > 4;
            })

        })


    }

    $scope.part1dropSuccess = function(data, event, index){
        // find existing and remove
        var removeIndex = part1searchSameItemInDropAndDragListAndRemove($scope.dropedWords, data.index, true);

        if(event.y > 400){
            // test if is here in drag list
            var alreadyHere = part1searchSameItemInDropAndDragListAndRemove($scope.dragWords, data.index);
            // is not in dragList add it
            if(alreadyHere == -1){
                $scope.dragWords.push(data);
            }
        }else {
            if(index == undefined){
                $scope.dropedWords.push(data);
            } else {
                // the item was on position before inserting positin
                // but becuse was already removed from array
                // update index about -1;
                if(removeIndex > -1 && removeIndex < index){
                    index-=1;
                }
                $scope.dropedWords.splice(index, 0, data);
            }
            // also remove from selector list
            part1searchSameItemInDropAndDragListAndRemove($scope.dragWords, data.index, true);
        }
    }

    $scope.btnPart1Select = function(index){
        if($scope.finish){
            $scope.btnNextCall($scope.part);
        }

        $scope.showResult = true;
        var buttonId = '#part0-btn-select-' + index;
        if(SENTENCES.word2[index].link == $scope.sentenceTop.link){
            countScore();
            $(buttonId).addClass('btn-success');
            // hide other buttons
            for(var i = 0; i != NUM_WORDS_SET; i++){
                if(i!=index){
                    var buttonIdothers = '#part0-btn-select-' + i;
                    $(buttonIdothers).fadeOut();
                }
            }

        } else {
            $scope.timer = 0;
            $scope.mistake = true;
            $(buttonId).fadeOut();

        }
    }

    $scope.btnNextCall = function(part){
        $scope.finish = false;
        $('#parts').fadeOut(function(){
            $scope.$apply(function(){
                if($scope.part == 0){
                    secondCall();
                }

            });


        });

    }

    function countScore(){
        if($scope.finish){
            // game over don't add new coins
            // the coins was already add
            return;
        }

        stopBonusInterval();
        $scope.showResult = true;
        $scope.finish = true;
        $scope.score += $scope.coins;
        if(!$scope.mistake){
            // user got in bonus time
            if($scope.timer > 0){
                $scope.score += $scope.bonus2;
            } else {
                // user don't got in bonus time
                // but first answer was corect
                $scope.score += $scope.bonus1;
            }
        }
    }

    function startBonusInterval(interval){
        $scope.timer = interval;
        bonusInterval = $interval(function(){
            $scope.timer -= 1;
        }, 1000, interval)
    }

    function stopBonusInterval(){
        if(bonusInterval && angular.isDefined(bonusInterval)){
            $interval.cancel(bonusInterval);
            bonusInterval = null;
        }
    }
}