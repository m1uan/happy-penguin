function InfoCtrl($scope, $routeParams, placeFactory, worldFactory, linksFactory, $translate, $timeout, vocabularyFactory){

    var placeId = $routeParams.placeid;


    $scope.wordsLoading = true;
    $scope.sentences = [{s:'ahoj',s2:'cau'}]

    placeFactory.setupPlace(placeId, function(successPlace){
        $scope.place = successPlace;


        worldFactory.loadPlace(placeId, function(plc){
            var game = worldFactory.game();
            $scope.game = game;
            $scope.place = plc;

            // sometime loadPlace is already loaded
            // and need to be apply
            $timeout(function(){
                setupInfo();
            }, 0)

        })



    });

    var Patt = new RegExp('\[[0-9]*\]', 'gm');
    var REGEXP = /\[([1-9]*)\]/;

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
        if($scope.game.coins < 1){
            var text = $translate.instant('not-enought-coins');
            alertify.alert(text);
            return;
        }

        vocabularyFactory.addToTrain(word.possible[0]);

        //$scope.game.coins -= 1;
        worldFactory.store();

        word.translated = true;
    }
}