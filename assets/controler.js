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

    function addToTemp(link){
        if(typeof link.word === 'undefined'){
            return;
        }

        var founded = false;
        for(var twindex in tempWord){
            var tw = tempWord[twindex];

            if(tw.link == link.link){
                if(tw.w1) {
                    tw.w2 = link.word;
                    tw.l2 = link.lang;

                }
                founded = true;
                break;
            }
        }

        if(!founded){
            tempWord.push({
                w1 : link.word,
                l1 : link.lang,
                link : link.link
            });

            console.log('create:');
            console.log(tempWord);
        }


    }


    $http({method: 'GET', url: '/words/lesson/1/cs/en'}).
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