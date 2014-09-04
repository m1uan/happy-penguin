function WordsTestCtrl($scope, $http, $routeParams, vocabularyFactory, worldFactory, $interval, $location, $translate){

    var BUTTON_STATUS_NORMAL = 0;
    var BUTTON_STATUS_SELECT = 1;
    var BUTTON_STATUS_CORRECT = 2;
    var BUTTON_STATUS_WRONG = 3;

    var GAME_TIME = 90;

    $scope.correct = 100;
    $scope.user_answer = '';

    $scope.facebookExtra = 0;

    $scope.correctInRow = 0;
    if(DEBUG_PENGUIN){
        GAME_TIME = 40;
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


    var placeid = $routeParams.placeid;

    $scope.part = 0;

    $scope.wordsLoading = true;
    worldFactory.loadPlace(placeid, function(place){
        $scope.place = place;

        $scope.levelInfo = worldFactory.calcLevelInfo();
        //startVocabularyTest();
        //showIntroduction();
        //showConclusion();
        if(DEBUG_PENGUIN){
            showIntroductionOrStartVocabularyTest();
            //showIntroduction();
            //startVocabularyTest();
            //showIntroduction();
            //showConclusion();
            //showQuestion();
        } else {
            // **** DONT CHANGE HERE ****
            showIntroductionOrStartVocabularyTest();
            // **************************
        }
        $scope.wordsLoading = false;

    });

    function loadExamplesForQuestion(type){

        // examples for question
        requestGET($http, '/admin/translates/get/'+game.learn+'/11/?group=1002&type=api&fields=key,data', function(data){
            var lookKey = 'example_answer_' + type;
            data.trans.some(function(trans){
                if(trans.key == lookKey){
                    $scope.example = trans.data;
                    return true;
                }
            });

        });
    }

    /**
     * have to be call after place loaded
     */
    function showQuestion(){

        $scope.part = 3;

        var haveAtleastOneQuestionWithAnswer = $scope.place.questions.some(function(q){
            // could happen the question is null, because is not translated to player-native-language
            return q && q.question && q.answers;
        });

        if(haveAtleastOneQuestionWithAnswer){
            do {
                var pos = worldFactory.getRandomNumber('question_place_'+placeid, $scope.place.questions.length);
                var answers = $scope.place.questions[pos].answers;

                // in some languages can answer missing
                if(answers){
                    $scope.questionText = $scope.place.questions[pos].question;
                    $scope.questionAnswers = answers.split(';');
                    $scope.questionType = $scope.place.questions[pos].type;

                }
                // could happend the quesiton is not translanted
                // like above (because is not translated to player-native-language)
                // generate random question till you reach the question
                // with question-text and questionAnswers
            } while(!$scope.questionText || !$scope.questionAnswers);

            loadExamplesForQuestion($scope.questionType);
        } else {
            showConclusion();
        }

        showRandomBackground();
    }

    function showIntroductionOrStartVocabularyTest(){
        // some places have not introduction (info) text
        // go straight way to vocabulary test
        if($scope.place.info){
            showIntroduction();
        } else {
            $scope.visit()
        }
    }

    function showIntroduction(){
        $scope.part = 0;
        showRandomBackground();

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

    function startVocabularyTest(){
        loadOrNext(function(){
            lastAnswer = moment();
            $interval(function(){
                $scope.timer -= 1;
                worldFactory.getStats().wordTestTime+=1;
                if($scope.timer == 0){
                    showQuestion();
                }

            }, 1000, GAME_TIME);
        });


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


    $scope.visit = function(){
        $scope.part = 1;
        startVocabularyTest();
    }


    function loadOrNext(cb){
        $scope.wordsLoading = true;
        // get words from game setting - not for current user switch :-)
        vocabularyFactory.getVocabularyRandomSet($scope.levelInfo.lesson, worldFactory.getLearn(), worldFactory.getNative(), function(words){
            $scope.correct = 0;
            $scope.words = words;
            console.log(words.word1)
            updateButtons();

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

    function correctAnswer(){
        $scope.correctTotal+=1;
        $scope.correct+=1;
        $scope.correctInRow+=1;
        countFastAnswer();
        countCorrectInRow();


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


    function updateButtons(){
        _updateButtons(0);
        _updateButtons(1);
    }

    function _updateButtons(side){
        var words = side == 0 ? $scope.words.word1 : $scope.words.word2;
        words.forEach(function(w,idx){
            var id = '#testbtn_'+side+'_' + idx;
            var btn = $(id);
            btn.removeClass('btn-default');
            btn.removeClass('btn-primary');
            btn.removeClass('btn-success');
            btn.removeClass('btn-warning');

            if(w.status == BUTTON_STATUS_SELECT){
                btn.addClass('btn-primary');
            } else if(w.status == BUTTON_STATUS_CORRECT){
                btn.addClass('btn-success');
            } else if(w.status == BUTTON_STATUS_WRONG){
                btn.addClass('btn-warning');
            } else {
                btn.addClass('btn-default');
            }


        })
    }


    function setStatusButton(side, status){
        var words = side == 0 ? $scope.words.word1 : $scope.words.word2;
        words.some(function(w,idx){
            if(w.status == BUTTON_STATUS_SELECT || w.status == BUTTON_STATUS_WRONG){
                w.status = status;
                return true;
            }
        });
    };


    function getLinkOfSelectedButton(side){
        var words = side == 0 ? $scope.words.word1 : $scope.words.word2;
        var link = -1;
        words.some(function(w,idx){
            if(w.status == BUTTON_STATUS_SELECT || w.status == BUTTON_STATUS_WRONG){
                link = w.link;
                return true;
            }
        });

        return link;
    };


    $scope.answer = function(skip){

        if(!skip){
            if(!$scope.user_answer){
                return ;
            }

            // have to be 2 or 1
            // because 0 - mean the user didn't answer yet
            // any other mean show the area with naswered text
            $scope.user_answered = $scope.questionAnswers.some(function(ans){
                return ans == $scope.user_answer;
            }) ? 2 : 1;


            var game = worldFactory.game();
            var mixdata = {
                placeId : game.placeId,
                lang: game.lang,
                learn: game.learn,
                user_answered: $scope.user_answered,
                user_answer : $scope.user_answer,
                questionAnswers : $scope.questionAnswers,
                questionText : $scope.questionText
            }


            track("answer", mixdata);

        } else {
            // user press button skip
            $scope.user_answered = 1;

            var game = worldFactory.game();
            var mixdata = {
                placeId : game.placeId,
                lang: game.lang,
                learn: game.learn,
                questionText : $scope.questionText
            }


            track("answer_skip", mixdata);
            showConclusion();
        }




    }

    $scope.conclusion = function(){
        showConclusion();

    }

    $scope.backToMap = function(){
        $location.path('/world');
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