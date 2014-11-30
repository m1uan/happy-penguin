function WordsTestCtrl($scope, $http, $routeParams, vocabularyFactory, worldFactory, $interval, $location, $translate){

    var NUM_WORDS_SET = 8;
    var GAME_TIME = 20;
    var MAX_TEST_PER_VISIT = 5;

    $scope.correct = 100;
    $scope.user_answer = '';

    $scope.facebookExtra = 0;

    $scope.correctInRow = 0;
    if(DEBUG_PENGUIN){
        GAME_TIME = 50;
        NUM_WORDS_SET = 3;
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
            // for case the user not yet visit a info
            // to unlock place's test -> redirect him to info
            if(worldFactory.redirectToInfoIsTestsUnlockedWithAlert(place)) {
                // test if the test was not run so offten
                $scope.repeats = worldFactory.getCountOfLeftToPlaceHistory(place, 'voc-test');
                if($scope.repeats < 1){
                    var mess = $translate.instant('voc-test-limit-test-max', {count:MAX_TEST_PER_VISIT});
                    alertify.alert(mess);
                    $location.path('/map')
                    return;
                } else {
                    startTest();
                }
            }



        });


    }

    function startTest(){
        var placeid = place.id;

        loadOrNext(function(){
            bonusInterval = $interval(function(){
                $scope.timer -= 1;

            }, 1000, $scope.timer, true)

            $scope.repeats -= 1;
            worldFactory.putCountOfLeftToPlaceHistory(place, 'voc-test', $scope.repeats);

        })
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
                color='lightgreen';
            } else {

            }

            $('#word-row-'+idx).css('background-color',color);
        })

        if(numOfCorrect == NUM_WORDS_SET){
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
            // without timeout is pointed somewhere else than on the button
            window.setTimeout(function(){
                showPopup('score-fb', $translate);
            }, 500);

            track('voc-test-score', $scope.score);
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
        vocabularyFactory.getVocabularyRandomSet(NUM_WORDS_SET, function(words){
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


    $scope.facebook = function(){
        var descData =  {
            name:$scope.place.name,
            coins : $scope.score};


        facebook($translate, 'fb_share_score', descData, function(e){
            $scope.apply(function(){
                $scope.facebookExtra = 25;
                $scope.score += 25;

                worldFactory.addScore({totalCoins:$scope.facebookExtra});
            })
            var infostr = $translate.instant('score_fb_share_info', {golds: $scope.facebookExtra});
            alertify.success(infostr);

        });
    }
}



