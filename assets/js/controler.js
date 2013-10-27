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
    var IMAGE_DIR = 'assets/img/';
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
                tw.image = IMAGE_DIR + addingWord.image;
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


        for(var idx in $scope.words){
           var w = $scope.words[idx];
           if(w.link==link){
               return w;
           }
           //console.log(w);
        };

        return null;
    }


    $scope.updateWord = function(lang, link) {
        var key = lang + '_' + link;
        var val = $('#ed_' + key).val();

        // upload just in case the word is changed
        if($scope.checkWord(lang, link)){
            updateWord(lang,link, val, function(data){
                data.forEach(function(word){
                    if(word.version == 0){
                        $('#tv_' + key).text(word.word);
                        $scope.checkWord(lang, link);
                        return;
                    }
                })

            });
        }

        var key2 = lang + '_' + (link+1);
        $('#ed_' + key2).focus();

        //alert('Submitted' + lang + lang + val);
    };


    $scope.focusWord = function(lang, link){

    }



    $scope.isSeznamShowed = false;
    $scope.showSeznam = function(lang, link){

        console.log('showSeznam', lang, link);

        $scope.isSeznamShowed = true;

        var word= getWordByLink(link);

        if(word){
            var langTxt;
            var wordTxt;
            if(word.l1 != lang){
                langTxt = word.l1 + '-' + word.l2;
                wordTxt = word.o2;
            } else {
                langTxt = word.l2 + '-' + word.l1;
                wordTxt = word.o1;
            }

            langTxt = langTxt.replace('cs','cz');

            var url = 'http://slovnik.seznam.cz/'+langTxt+'/word/?q=' + wordTxt;
            var seznam = $('#slovnik_seznam_cz');

            //var win = window.open(url, 'seznam_cz');
            //win.blur();
            var key = lang + '_' + (link);
            var obj = $('#ed_' + key);



            if(seznam.attr('src') != url){
                console.log('furl', url + '  attr("src"):' +seznam.attr('src'));
                seznam.attr('src', url);
                seznam.ready(function(data, data2){
                    var key = lang + '_' + (link);
                    //$('#ed_' + key).focus();
                    console.log('load', seznam.attr('src'));
                });
            }

        }
    }

    $scope.isGoogleImageShowed = false;
    $scope.showGImage = function(lang, link){

        console.log('showGImage', lang, link);

        //$scope.isGoogleImageShowed = true;

        var word= getWordByLink(link);

        if(word){
            //var langTxt;
            var wordTxt;
            if(word.l1 != lang){
            //    langTxt = word.l1 + '-' + word.l2;
                wordTxt = word.o2;
            } else {
            //    langTxt = word.l2 + '-' + word.l1;
                wordTxt = word.o1;
            }

            //langTxt = langTxt.replace('cs','cz');

            var url = 'https://www.google.co.nz/search?source=lnms&tbm=isch&q='+wordTxt;
            var googleImage = $('#google_image_com');

            var win = window.open(url, 'name_cz');
            console.log('name', win.name);

            if(googleImage.attr('src') != url){
                console.log('furl', url + '  attr("src"):' +googleImage.attr('src'));
                //googleImage.attr('src', url);
                googleImage.ready(function(data, data2){
                    //var key = lang + '_' + (link);
                    //$('#ed_' + key).focus();
                    console.log('load', googleImage.attr('src'));
                });
            }

        }
    }

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

    $scope.updateImageFromURL = function(link){
        var editorId = '#image_url_' + link;
        var editor = $(editorId);

        var val = editor.val();
        if(!val || val.length < 1){
           console.log('updateImageFromUrl', editorId, 'empty');
        }

        saveImgUrl(link, val, function(data){

            for(var idx in data){
                var cd = data[idx];

                if(cd.version == 0){
                    var word = getWordByLink(link);
                    word.image = IMAGE_DIR + word.image;
                    return;
                }

            }

        });
    }

    function saveImgUrl(link,url,cb){
        var dataContainer = {
            url : url,
            link : link
        };


        $http({
            method: 'POST',
            url: '/words/saveimgurl',
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


    function updateWord(lang,link,word,cb){
        var dataContainer = {
            lang : lang,
            link : link,
            word: word
        };


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