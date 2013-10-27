var app = angular.module('words',[]);

app.directive('onEnter',function(){

    var linkFn = function(scope,element,attrs) {
        element.bind("keypress", function(event) {
            if(event.which === 13) {
                scope.$apply(function() {
                    console.log('enter boy');
                    scope.$eval(attrs.onEnter)
                });
            }
        });
    };

    return {
        link:linkFn
    };
});

function WordWebCtrl($scope, $rootScope,$http, $location) {

    var WORD_STATUS = {
        CURRENT : 1 ,
        EDITED : 2,
        SAVING : 3,
        SAVED : 4

    };

    $scope.languages =[
    'en',
    'cs',
    'pt']

    $scope.lessons =[
        1001,
        2001,
        2002]

    $scope.lesson = ['lesson', 'lang 1' , 'lang 2'];
    $scope.words=[
        {
            l1:'cs',
            l2: 'en',
            w1:'ahoj',
            w2:'hello',
            link: 1,
            image: 'blabla',
            status : WORD_STATUS.CURRENT

        }
    ];

    $scope.location = $location.path();

    $scope.$on('$locationChangeSuccess', function () {
        $scope.location = $location.path();
        console.log('$locationChangeSuccess changed!', $location.path());
        loadWords ($location.path());
    });

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
                    tw.status = WORD_STATUS.CURRENT;

                }
                founded = true;
            }

            if (addingWord.image) {
                // addingWord is image with description
                tw.image = 'assets/img/' + addingWord.image;
                founded = true;

            }

            if(addingWord.description){
                tw.description = addingWord.description;
                founded = true;
            }

            break;

        }

        if(!founded && addingWord.word){
            tempWord.push({
                w1 : addingWord.word,
                l1 : addingWord.lang,
                link : addingWord.link
            });

            console.log('create:');
            console.log(tempWord);
        }


    }

    /**
     * loadWords
     * @param lessonAndLang - /2002/en/cs
     */
    function loadWords(lessonAndLang){
        $http({method: 'GET', url: '/words/lesson' +lessonAndLang }).
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


    $scope.langChange = function(idx, value){
        var lesson = $scope.lesson;

        lesson[idx] = value;

        if(lesson[0] != 'lesson'
            && lesson[1] != 'lang 1'
            && lesson[2] != 'lang 2'){
            $location.path('/' + lesson.join('/'));

        }

        $scope.lesson = lesson;
        //alert(idx + value);
    }

    $scope.myFunc = function(lang, lesson) {
        alert('Submitted' + lang + lesson);
    };
}