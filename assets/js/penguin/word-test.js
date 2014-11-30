function WordsTestCtrl($scope, $http, $routeParams, vocabularyFactory, worldFactory, $interval, $location, $translate){

    var BUTTON_STATUS_NORMAL = 0;
    var BUTTON_STATUS_SELECT = 1;
    var BUTTON_STATUS_CORRECT = 2;
    var BUTTON_STATUS_WRONG = 3;


    var TRANSLATE_TIME_MAX = 30;

    var GAME_TIME = 20;
    var MAX_TEST_PER_VISIT = 5;

    $scope.correct = 100;
    $scope.user_answer = '';

    $scope.facebookExtra = 0;

    $scope.correctInRow = 0;
    if(DEBUG_PENGUIN){
        GAME_TIME = 50;
        $scope.correctTotal = 0;
        $scope.correctInRowScore = [1,1,1,1,1];
        $scope.fastAnswerScore = [1,1,1];
        //$scope.correctInRowScore = [0,0,0,0,0];
        //$scope.fastAnswerScore = [0,0,0];
    } else {
        $scope.correctTotal = 0;
        $scope.correctInRowScore = [0,0,0,0,0];
        $scope.fastAnswerScore = [0,0,0];
    }


    var game = worldFactory.game();

    $scope.wrong = 0;
    $scope.timer = GAME_TIME;

    $scope.user_answered = 0;
    // TODO: detect if user have been here before
    $scope.first_time_visit = 1;

    var lastAnswer = new Date().getTime();


    $scope.score = {
        fly : 1,
        swim : 2,
        walk : 1,
        exp : 0
    }

    $scope.wordsLoading = true;

    var bonusInterval = null;


    init();
    var place;

    function init(){
        $scope.part = 0;
        $scope.allCorrect = true;
        $scope.showResult = false;
        $scope.score = 0;
        $scope.timer = GAME_TIME;

        worldFactory.getCurrentPlaceAsync(function(p){
            place = p;

            // test if the test wasn rum so offen
            if(getCountTestHistory() > MAX_TEST_PER_VISIT){
                var mess = $translate.instant('msg-voc-test-limit-test-max', {limit:MAX_TEST_PER_VISIT});
                alertify.alert(mess);
                $location.path('/map')
                return;
            } else {
                startTest();
            }


        });


    }

    function startTest(){
        var placeid = place.id;

        loadOrNext(function(){
            bonusInterval = $interval(function(){
                $scope.timer -= 1;

            }, 1000, $scope.timer, true)

            setupCountTestHistory(1);
            $scope.repeats = MAX_TEST_PER_VISIT - getCountTestHistory();
        })
    }

    function generateCountTestHistoryKey(){
        if(place.history.countVisit == undefined){
            place.history.countVisit = 0;
        }

        return 'countVocTest' + place.history.countVisit;
    }

    function setupCountTestHistory(increment){
        var countVocTest = generateCountTestHistoryKey();
        if(place.history[countVocTest] == undefined){
            place.history[countVocTest] = increment;
        } else {
            place.history[countVocTest] += increment;
        }

        worldFactory.store();
    }

    function getCountTestHistory(){
        var countVocTest = generateCountTestHistoryKey();
        return place.history[countVocTest] || 0;
    }

    $scope.btnRepeat = function(){
        init();
    }

    $scope.btnBack = function(){
        $location.path('/map');
    }

    $scope.check = function(){
        if(bonusInterval && angular.isDefined(bonusInterval)){
            $interval.cancel(bonusInterval);
            bonusInterval = null;
        }

        var user = $scope.words.user;
        var word1 = $scope.words.word1;

        var someMissing = user.some(function(w,idx){
            return w == null;
        });

        if(someMissing){
            var text = $translate.instant('msg-voctest-complete-all');
            alertify.error(text);
            return;
        }


        var numOfCorrect = 0;
        user.forEach(function(w,idx){
            var color = 'red';
            if(word1[idx].link == w.link){
                numOfCorrect += 1;
                color='green';
            } else {

            }

            $('#word-row-'+idx).css('background-color',color);
        })

        if(numOfCorrect == 8){
            $scope.showResult = true;
            $scope.score = numOfCorrect;
            if($scope.allCorrect){
                if($scope.timer > 0){
                    $scope.score += 10;
                } else {
                    $scope.score += 5;
                }
            }
            worldFactory.addScore({totalCoins:$scope.score});
        } else {
            $scope.allCorrect = false;
        }
    }

    $scope.onDropSuccess = function(index, data,event){
        console.log(index,data,event);

        var si = -1;
        var word2 = $scope.words.word2;
        word2.some(function(w,idx){
            if(w.link == data.link){
                si = idx;
                return true;
            }
        })

        if(si> -1){
            word2.splice(si, 1);
        }

        // is comming from another user
        // basicaly user swiping between two items
        var swipedIdx = -1;
        $scope.words.user.some(function(w, idx){
            if(w && w.link == data.link){
                swipedIdx = idx;
                return true;
            }
        });

        if(swipedIdx > -1){
            $scope.words.user[swipedIdx] = $scope.words.user[index];
            $scope.words.user[index] = null;

            // here was before orange bat after the user
            // put htis element here is again empty
            if(!$scope.words.user[swipedIdx]){
                $('#word-row-'+swipedIdx).css('background-color','inherit');
            } else {
                // also put orange there because after the check row could be red
                $('#word-row-'+swipedIdx).css('background-color','orange');
            }
        }

        // is already something in list
        // add back to selector
        if($scope.words.user[index]){
            word2.push($scope.words.user[index]);
        }

        $scope.words.user[index] = data;

        $('#word-row-'+index).css('background-color','orange');

    }





    function showConclusion(){



        $scope.part = 4;
        $scope.score.walk = Math.round(($scope.correctTotal)/4);
        $scope.correctCoins = Math.round(($scope.correctTotal)/4);

        $scope.correctInRowCoins = [0,0,0,0,0];
        $scope.correctInRowCoins[0] = Math.floor($scope.correctInRowScore[0] / 2);
        $scope.correctInRowCoins[1] = Math.round($scope.correctInRowScore[1]);
        $scope.correctInRowCoins[2] = Math.floor($scope.correctInRowScore[2]*3);
        $scope.correctInRowCoins[3] = Math.floor($scope.correctInRowScore[3]*7);
        $scope.correctInRowCoins[4] = Math.round($scope.correctInRowScore[4]*15);
        /*$scope.score.swim = Math.round(
            $scope.correctInRowScore[0]/3
                +  $scope.correctInRowScore[1]/2
                +  $scope.correctInRowScore[2]
                +  $scope.correctInRowScore[3]*2.5
                +  $scope.correctInRowScore[4]*5.5);*/

        $scope.fastAnswerCoins = [0,0,0];
        $scope.fastAnswerCoins[0] = Math.floor($scope.fastAnswerScore[0] *3);
        $scope.fastAnswerCoins[1] = Math.round($scope.fastAnswerScore[1]);
        $scope.fastAnswerCoins[2] = Math.floor($scope.fastAnswerScore[2] /3);

        /*$scope.score.fly = Math.round(
            $scope.fastAnswerScore[0] / 6
                + $scope.fastAnswerScore[1] /5
                + $scope.fastAnswerScore[2] /4);*/

        $scope.score.exp = Math.round(Math.floor($scope.user_answered) * 2 + $scope.first_time_visit);

        $scope.score.totalCoins = $scope.correctCoins + $scope.facebookExtra + $scope.user_answered * 2 + $scope.first_time_visit;


        var stats = worldFactory.getStats();
        stats.correct += $scope.correctTotal;
        stats.wrong += $scope.wrong;
        stats.walkTotal += $scope.score.walk;
        stats.swimTotal += $scope.score.swim;
        stats.flyTotal += $scope.score.fly;
        stats.expTotal += $scope.score.exp;
        stats.coinTotal += $scope.score.coin;
        stats.user_answered += Math.floor($scope.user_answered/2);

        $scope.correctInRowScore.forEach(function(cirs, idx){
            stats.correctInRowScore[idx] += cirs;
            //stats.correctInRowCoins[idx] += $scope.correctInRowCoins[idx];
            $scope.score.totalCoins += $scope.correctInRowCoins[idx];
        });

        $scope.fastAnswerScore.forEach(function(fas, idx){
            stats.fastAnswerScore[idx] += fas;
            //stats.fastAnswerCoins[idx] += $scope.fastAnswerCoins[idx];
            $scope.score.totalCoins += $scope.fastAnswerCoins[idx];
        });

        var mixdata = {
            correct:$scope.correctTotal,
            wrong:$scope.correctTotal,
            'correctInRowScore[0]' : $scope.correctInRowScore[0],
            'correctInRowScore[1]' : $scope.correctInRowScore[1],
            'correctInRowScore[2]' : $scope.correctInRowScore[2],
            'correctInRowScore[3]' : $scope.correctInRowScore[3],
            'correctInRowScore[4]' : $scope.correctInRowScore[4],
            'fastAnswerScore[0]' : $scope.fastAnswerScore[0],
            'fastAnswerScore[1]' : $scope.fastAnswerScore[1],
            'fastAnswerScore[2]' : $scope.fastAnswerScore[2],
            'coins' : $scope.totalCoins,
            'wordTestTime' : stats.wordTestTime,
            travelersTotal: $scope.travelersTotal,
            citiesTotal : $scope.citiesTotal,
            'placesTotal': stats.placesTotal,
            'placesUniq' : game.visited.length,
            placeId : game.placeId,
            lang: game.lang,
            learn: game.learn
        }

        track("conclusion", mixdata);

        // without timeout is pointed somewhere else than on the button
        window.setTimeout(function(){
            showPopup('score-fb', $translate);
        },1500 );

    }





    function showRandomBackground(){
        var img = '/assets/img/orig/place/1399279830623-27882-ldhox9.jpg'
        if($scope.place.images && $scope.place.images.length > 0){
            var pos = worldFactory.getRandomNumber('image_place_'+placeid,$scope.place.images.length);

            img = '/assets/img/orig/' + $scope.place.images[pos].image;
            $scope.lastBackgroundImage = pos;
        }


        $('#body').css("background-image", "url("+img+")");
    }




    function loadOrNext(cb){
        $scope.wordsLoading = true;
        // get words from game setting - not for current user switch :-)
        vocabularyFactory.getVocabularyRandomSet($scope.levelInfo.lesson, worldFactory.getLearn(), worldFactory.getNative(), function(words){
            $scope.correct = 0;
            $scope.words = words;
            $scope.words.user = [];
            $scope.words.word1.forEach(function(w){
                $scope.words.user.push(null);
            })

            console.log(words.word1)
            //updateButtons();

            if(cb){
                cb();
            }

            $scope.wordsLoading = false;

        });
    }

    function countCorrectInRow(){
        var tell = null;


        if($scope.correctInRow > 50){
            $scope.correctInRowScore[4] += 1;
            $scope.correctInRowScore[3] -= 1;
            tell='50';
        } else if($scope.correctInRow == 30){
            $scope.correctInRowScore[3] += 1;
            $scope.correctInRowScore[2] -= 1;
            tell = '30';
        } else if($scope.correctInRow == 15){
            $scope.correctInRowScore[2] += 1;
            $scope.correctInRowScore[1] -= 1;
            tell = '15';
        } else if($scope.correctInRow == 10){
            $scope.correctInRowScore[1] += 1;
            $scope.correctInRowScore[0] -= 1;
            tell = '10';
        } else if($scope.correctInRow == 5){
            $scope.correctInRowScore[0] += 1;
            tell = '5';
        }

        if(tell){
            var ins = $translate.instant('correct_in_row', {correct:tell});
            alertify.success(ins);
        }
    }

    function countFastAnswer(){
        var time = new Date().getTime();
        var diff = time - lastAnswer;
        var name = 0;
        if(diff < 1500){
            name = 1;
        }else if(diff < 2000){
            name = 2;
        } else if(diff < 2500){
            name = 3;
        }

        if(name){
            $scope.fastAnswerScore[name-1] += 1;
            var ins = $translate.instant('correct_fast', {fast:name});
            alertify.success(ins);
        }

        lastAnswer = new Date().getTime();
    }


    $scope.select = function(side, word, event){
        // button already coreclty selected
        if(word.status == BUTTON_STATUS_CORRECT) {
            return ;
        }


        // select this side to normal for case there is selected another button
        setStatusButton(side, BUTTON_STATUS_NORMAL);

        var status = BUTTON_STATUS_SELECT;

        if(!word.status){
            word.status = status;
        }



        var link1 = getLinkOfSelectedButton(0);
        var link2 = getLinkOfSelectedButton(1);

        if(link1 !=-1 && link2 !=-1){
            if(link2 == link1){
                status = BUTTON_STATUS_CORRECT;
                correctAnswer();
            } else {
                status = BUTTON_STATUS_WRONG;
                $scope.wrong+=1;
                $scope.correctInRow=0;

            }
            // select also second side of buttons with this status
            setStatusButton(side == 0 ? 1 : 0, status);
        }

        console.log(link1,link2,status);


        word.status = status;


        updateButtons();

        if(status == BUTTON_STATUS_CORRECT && $scope.correct == $scope.words.word1.length){
            loadOrNext(function(){
                showRandomBackground();
            });

        }
    }






    $scope.conclusion = function(){
        showConclusion();

    }

    $scope.backToMap = function(){
        $location.path('/map');
        worldFactory.addScore($scope.score);
    }

    $scope.facebook = function(){
        var descData =  {
            name:$scope.place.name,
            coins : $scope.totalCoins};


        facebook($translate, 'fb_share_score', descData, function(e){
            $scope.apply(function(){
                $scope.facebookExtra = 25;
                showConclusion();
            })
            var infostr = $translate.instant('score_fb_share_info', {golds: $scope.facebookExtra});
            alertify.success(infostr);

        });
    }
}