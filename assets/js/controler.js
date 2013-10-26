function WordWebCtrl($scope, $http, $route, $routeParams, $location) {

    $scope.words=[
        {
            l1:'cs',
            l2: 'en',
            w1:'ahoj',
            w2:'hello',
            link: 1,
            image: 'blabla'
        }
    ];



    var tempWord = [];

    function addToTemp(addingWord){


        var founded = false;
        for(var twindex in tempWord){
            var tw = tempWord[twindex];
            var link = addingWord.link || addingWord.lid;

            // this link is not the same like in set
            if(tw.link != link){
                continue;
            }

            // addingWord is real word
            if(addingWord.word){
                if(tw.w1) {
                    tw.w2 = addingWord.word;
                    tw.l2 = addingWord.lang;

                }
                founded = true;
            }

            if (addingWord.image) {
                // addingWord is image with description
                tw.image = 'assets/img/' + addingWord.image;

            }

            if(addingWord.description){
                tw.description = addingWord.description;
            }

            break;

        }

        if(!founded){
            tempWord.push({
                w1 : addingWord.word,
                l1 : addingWord.lang,
                link : addingWord.link
            });

            console.log('create:');
            console.log(tempWord);
        }


    }


    $http({method: 'GET', url: '/words/lesson/2001/cs/en'}).
        success(function(data, status, headers, config) {
            tempWord = [];

            //console.error('ahoj');
            data.forEach(function(data2, idx){

                data2.forEach(function(link, idx){

                    addToTemp(link);
                });
            });

            $scope.words = tempWord;

        }).
        error(function(data, status, headers, config) {
            // called asynchronously if an error occurs
            // or server returns response with an error status.
        });

}