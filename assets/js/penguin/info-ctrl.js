function InfoCtrl($scope, $rootScope, $routeParams, placeFactory, worldFactory, linksFactory, $translate, $timeout, vocabularyFactory, $location){


    $scope.unlockCount = 5;
    worldFactory.getCurrentPlaceAsync(function(place){
        $scope.place = place;

        // set leftWords if place already not unlocked test and sentences in this visit
        var unlocked = worldFactory.getCountOfLeftToPlaceHistory(place,'info')
        $scope.leftWords = unlocked ? 0 : $scope.unlockCount;

        worldFactory.loadPlace($scope.place.id, function(plc){

            // this place have no info
            if(!plc.info){
                // maybe in this place is not
                unlockTestAndSentences();

                $location.path('/map');
                console.error('no info here!')
                return;
            }



            var game = worldFactory.game();
            $scope.game = game;
            $scope.place = plc;
            $scope.price = place.history.countVisit || 1;

            // sometime loadPlace is already loaded
            // and need to be apply
            $timeout(function(){
                setupInfo();
            }, 0)

        })
    });


    $scope.wordsLoading = true;
    $scope.sentences = [{s:'ahoj',s2:'cau'},{s:'ahoj',s2:'cau'},{s:'ahoj',s2:'cau'},{s:'ahoj',s2:'cau'},{s:'ahoj',s2:'cau'},{s:'ahoj',s2:'cau'}]



    var Patt = new RegExp('\[[0-9]*\]', 'gm');
    var REGEXP = /\[([1-9]*)\]/;

    function unlockTestAndSentences(){
        // for next time, this is already unlocked once
        worldFactory.putCountOfLeftToPlaceHistory($scope.place,'info', 1);
        worldFactory.putCountOfLeftToPlaceHistory($scope.place,'voc-test', 30);
        worldFactory.putCountOfLeftToPlaceHistory($scope.place,'sentences', 30);

        var info = $translate.instant('info-tests-unlocked');
        alertify.success(info);
    }

    function setupInfo(){


        $scope.blocks = [];
        $scope.secret = [];
        var blocks = $scope.place.info.split('\n\n');
        var numProcesedBlock = 0;
        // sometime is history empty (after new game and first visit)
        var historyVisit = $scope.place.history.countVisit || 1;

        var allWords = []
        blocks.forEach(function(block, idx){
            var trimedBlock = block.trim();
            if(trimedBlock.length < 1){
                return;
            }

            if(historyVisit > idx){
                var words = getWordsFromBlock(trimedBlock);
                $scope.blocks.push(words);
                allWords = allWords.concat(words);
            } else {
                $scope.secret.push(trimedBlock);
            }
        });


        linksFactory.get(worldFactory.getNative(), allWords, function(){
            $scope.wordsLoading = false;
            $('#introduction').niceScroll();
            $('#info-sentences').niceScroll();
        }, worldFactory.getLearn());


    }

    function getWordsFromBlock(block){

        var words = [];
        block.split(' ').forEach(function(w){
            var word = {
                simple : w.replace(Patt, '')
            }

            var link = w.match(REGEXP)
            if(link && link.length == 2){
                // link[0] = '[1234]'
                // link[1] = '1234' - take this
                word.link = link[1];
            }
            words.push(word)
        })


        return words;
    }


    $scope.clickTranslate = function(word){

        // if the word have no link it is mean is not translatable word
        if(!word.link){
            return;
        }

        linksFactory.getSentencesToLink(worldFactory.getNative(), word.link, function(sentences){
            $timeout(function(){
                $scope.sentences = sentences;
            },0)


        }, worldFactory.getLearn())


        // word already translated, don't charge more coins
        if(word.translated){
            return;
        }

        // no more coins
        if($scope.game.coins < $scope.price){
            var text = $translate.instant('not-enought-coins');
            alertify.alert(text);
            return;
        }

        if(word && word.possible){
            vocabularyFactory.addToTrain(word.possible[0]);
        }

        $scope.game.coins -= $scope.price;

        // have to be 1 before decrease
        // because if we compring 0 we don't know
        // if leftWords was 0 from initial (already unlocked)
        if($scope.leftWords == 1){
            unlockTestAndSentences();
        }
        $scope.leftWords -= 1;

        worldFactory.store();

        word.translated = true;
    }


    $scope.btnBack = function(){
        if($scope.leftWords > 0){
            var info = $translate.instant('info-not-enought-words-for-unlock', {count:$scope.unlockCount});
            alertify.alert(info);
        } else {
            $location.path('/map');
        }
    }

}