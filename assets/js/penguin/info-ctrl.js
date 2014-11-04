function InfoCtrl($scope, $routeParams, placeFactory, worldFactory, linksFactory){

    var placeId = $routeParams.placeid;


    $scope.wordsLoading = true;

    placeFactory.setupPlace(placeId, function(successPlace){
        $scope.place = successPlace;


        worldFactory.loadPlace(placeId, function(plc){
            $scope.place = plc;
            setupInfo();
        })

    });

    var Patt = new RegExp('\[[0-9]*\]', 'gm');
    var REGEXP = /\[([1-9]*)\]/;

    function setupInfo(){


        $scope.blocks = [];
        $scope.secret = [];
        var blocks = $scope.place.info.split('\n\n');
        var numProcesedBlock = 0;
        var historyVisit = $scope.place.history.countVisit;
        blocks.forEach(function(block, idx){
            var trimedBlock = block.trim();
            if(trimedBlock.length < 1){
                return;
            }

            if(historyVisit > idx){
                var words = getWordsFromBlock(trimedBlock);
                $scope.blocks.push(words);
            } else {
                $scope.secret.push(trimedBlock);
            }
        });


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

        linksFactory.get('cz', words, function(){
            $scope.wordsLoading = false;
        });
        return words;
    }


    $scope.clickTranslate = function(word){
        word.translated = true;
    }
}