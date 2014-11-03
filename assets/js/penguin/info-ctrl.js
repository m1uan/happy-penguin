function InfoCtrl($scope, $routeParams, placeFactory, worldFactory, linksFactory){

    var placeId = $routeParams.placeid;
    var place;


    var simpleText = 'ahoj[1] jak[2] se[3] mas[4]?';

    $scope.wordsLoading = true;

    placeFactory.setupPlace(placeId, function(successPlace){
        $scope.place = successPlace;


        worldFactory.loadPlace(placeId, function(plc){
            $scope.place = plc;
            setupInfo();
        })

    });


    function setupInfo(){
        var patt = new RegExp('\[[0-9]*\]', 'gm');
        var regExp = /\[[1-9]\]/;

        var words = $scope.place.info.split(' ');
        var links = [];
        $scope.words = [];
        words.forEach(function(w){
            var link = w.search(regExp)
            var word = {
                simple : w.replace(patt, ''),
                link : link
            }

            if(link > 0 && links.indexOf(link) == -1){
                links.push(link);
            }

            $scope.words.push(word)

            linksFactory.get('cz', $scope.words, function(){
                $scope.wordsLoading = false;
            });
        })
    }


    $scope.clickTranslate = function(word){
        word.translated = true;
    }
}