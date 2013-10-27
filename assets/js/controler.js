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
    'de',
    'it']

    $scope.lessons =[
        1001,
        2001,
        2002,
        2003,
        2004,
        2005,
        2006,
        2007,
        2008]

    $scope.lesson = ['lesson', 'lang 1' , 'lang 2'];
    $scope.words=[
        {
            l1:'cs',
            l2: 'en',
            w1:'ahoj',
            w2:'hello',
            o1:'ahoj',
            o2:'hello',
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
        if(addingWord.version !== 0) {
            return;
        }

        var founded = false;
        for(var twindex in tempWord){
            var tw = tempWord[twindex];
            var link = addingWord.link || addingWord.lid;

            // this link is not the same like in set
            // hadle only version 0
            if(tw.link != link){
                //console.log(tw);
                continue;
            }

            // addingWord is real word
            if(addingWord.word){
                if(tw.w1) {
                    tw.o2 = tw.w2 = addingWord.word;
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
                o1 : addingWord.word,
                l1 : addingWord.lang,
                link : addingWord.link,
                status : WORD_STATUS.CURRENT
            });

            //console.log('create:');
            //console.log(tempWord);
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

    function getWordByLink(link){
        $scope.words.forEach(function(w){
           if(w.link==link){
               return w;
           }
        });
    }


    $scope.updateWord = function(lang, link) {
        var key = lang + '_' + link;
        var val = $('#ed_' + key).val();

        updateWord(lang,link, val, function(data){
            data.forEach(function(word){
                if(word.version == 0){
                    $('#tv_' + key).text(word.word);
                    $scope.checkWord(lang, link);
                    return;
                }
            })

        });


        //alert('Submitted' + lang + lang + val);
    };

    /**
     * show button save if the word is diferent like orig
     * @param lang
     * @param link
     * @returns {boolean} - word is diferent from orig
     */
    $scope.checkWord = function(lang, link) {
        var key = lang + '_' + link;
        var val = $('#ed_' + key).val();
        var orig = $('#tv_' + key).text();

        console.log('checkWord (val:' + val + ";" + orig);

        var word = getWordByLink(link);

        var indicator = $('#in_' + key);

        var readyForUpdate = false;

        if(val == orig){
            indicator.addClass('hide');
            //if(word.status != WORD_STATUS.SAVED) {
           //     word.status = WORD_STATUS.CURRENT;
            //}

        } else {
            indicator.removeClass('hide');
            readyForUpdate = true;
            //word.status = WORD_STATUS.EDITED;
        }

        var indicator2 = $('#in_' + link);
        //if(word.status== WORD_STATUS.CURRENT){
            //indicator2.removeClass('label-default');
       // } else {
            //indicator2.addClass('label-primary');
        //}

        return readyForUpdate;
    }

    function updateWord(lang,link,word,cb){
        var dataContainer = {
            lang : lang,
            link : link,
            word: word
        };

        // upload just in case the word is changed
        if($scope.checkWord(lang, link)){
            $http({
                method: 'POST',
                url: '/words/update',
                data: dataContainer}).
                success(function(data, status, headers, config) {
                    console.log(data);
                    cb(data);
                }).
                error(function(data, status, headers, config) {
                    // called asynchronously if an error occurs
                    // or server returns response with an error status.
                });
        }

    }
}