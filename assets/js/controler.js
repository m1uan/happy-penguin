var app = angular.module('words',['angularFileUpload']);



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

app.directive('myRepeatDirective', function() {
    return function(scope, element, attrs) {
        var el = angular.element(element);
        el.css('color','blue');
        console.log(el);

        var im = el.find('img');
        var inp = el.find('input');
        console.log(attrs);

        var linkId  = attrs.id.split('_')[0];

        //console.log('link', linkId, im, inp);
        dragImage(im, inp, linkId);


        //console.log('im', attrs.id);
        //console.log('element', attrs('id'));
        //if (scope.$last){
            //window.alert("im the last!");
        //}
    };
})  ;

function WordWebCtrl($scope, $rootScope,$http, $location, $upload) {
    var IMAGE_DIR = 'assets/img/';
    var WORD_STATUS = {
        CURRENT : 1 ,
        EDITED : 2,
        SAVING : 3,
        SAVED : 4

    };

    $scope.loading = false;

    $scope.languages =['en','cs', 'de','it','es','pt','ru','sr','zh']

    $scope.lessons =[ 1001, 1002, 1003,1004, 1005, 2001, 2002, 2003, 2004, 2005, 2006, 2007, 2008, 3001, 3002, 3003, 3004, 3005, 3007, 3008, 4001, 4002, 4003, 4004, 4005, 4006, 4007, 4008, 4009, 4010,101, 102, 103, 104, 105, 106, 107, 108, 109, 110 ];

    var duplicityLoading = [];

    $scope.lesson = ['lesson', 'lang 1' , 'lang 2'];
    $scope.words={
        /*'1' : {
            l1:'cs',
            l2: 'en',
            w1:'ahoj',
            w2:'hello',
            o1:'ahoj',
            o2:'hello',
            image: 'blabla',
            status : WORD_STATUS.CURRENT
        }  */
    };

    $scope.location = $location.path();

    $scope.$on('$locationChangeSuccess', function () {
        $scope.location = $location.path();
        console.log('$locationChangeSuccess changed!', $location.path());
        loadWords ($location.path());

    });

    var tempWord = [];


    function loadDuplicity(location) {
        // 15 the response is ~27s (SQL LIMIT 25)
        // 75 the response is ~1:27s  (SQL LIMIT 25)
        // 2 the response is ~3s  (SQL LIMIT 6)
        // 80 the response is ~2:00s  (SQL LIMIT 6) and 502
        var maxDuplicityOnRow = 50;

        if(duplicityLoading.length < 1) {
            return;
        }

        var onRow = [];

        while(duplicityLoading.length > 0 && onRow.length < maxDuplicityOnRow ) {
            var link =  duplicityLoading.shift();
            onRow.push(link);
        }



        $http.post('/words/duplicity' + location, {links: onRow}).
            success(function(data, status, headers, config) {
                console.log(data);
                var tempWords = $scope.words;
                onRow.forEach(function(row, idx){
                    if(data[row].length > 0){
                        tempWords[row].duplicity = data[row];
                    } else {
                        // let angular know about already loaded and hide loading
                        tempWords[row].duplicity = true;
                    }
                });
                $scope.words = tempWords;
                /***
                 *  recal duplicity with rest of duplicity list
                 * */
                loadDuplicityTimer(location);
            }).
            error(function(data, status, headers, config) {

            });


    }

    function loadDuplicityTimer(location){
        var loc = location;


        setTimeout(function(){
            loadDuplicity(loc);
        }, 1000);
    }

    /**
     * loadWords
     * @param lessonAndLang - /2002/en/cs
     */
    function loadWords(lessonAndLang){
        $scope.loading = true;
        setTimeout(function() {
            $http({method: 'GET', url: '/words/lesson' +lessonAndLang }).
                success(function(data, status, headers, config) {
                    console.log(data);
                    tempWord = {};
                    duplicityLoading = [];

                    data[0].forEach(function(link){
                       tempWord[link.lid] = {
                          description : link.description,
                          link : link.lid,
                          w1 : '',
                          w2 : '',
                          duplicity : false
                       }

                       if(link.thumbfile){
                           tempWord[link.lid].imagefile = 'assets/img/thumb/' + link.thumbfile;
                       } else if(link.imagefile) {
                           tempWord[link.lid].imagefile = 'assets/img/orig/' + link.imagefile;
                       }

                        duplicityLoading.push(link.lid);
                    });


                    data[1].forEach(function(w){
                        var l = tempWord[w.link];
                        l.w1 = w.word;
                        l.o1 = w.word;
                        l.l1 = w.lang;
                    });

                    data[2].forEach(function(w){
                        var l = tempWord[w.link];
                        l.w2 = w.word;
                        l.o2 = w.word;
                        l.l2 = w.lang;
                    });
                    //console.error('ahoj');


                    $scope.words = tempWord;
                    $scope.loading = false;

                    loadDuplicityTimer(lessonAndLang);
                }).
                error(function(data, status, headers, config) {
                    // called asynchronously if an error occurs
                    // or server returns response with an error status.
                    $scope.loading = false;
                });


        }, 300);

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
        return $scope.words[link];
    }

    function generateRecord(word, forLang){
        var gr = [];

        if(forLang == word.l1){
            gr.push(word.o1);
            gr.push(word.l2);
            gr.push(word.w2);
        } else {
            gr.push(word.o2);
            gr.push(word.l1);
            gr.push(word.w1);
        }

        // format:
        //      old-word|second-lang|second-lang-word
        // max length: 50
        return gr.join('|').substring(0,50);
    }

    $scope.updateWord = function(lang, link) {
        var key = lang + '_' + link;
        var val = $('#ed_' + key).val();


        var w = getWordByLink(link);
        var record = generateRecord(w, lang);

        // upload just in case the word is changed
        if($scope.checkWord(lang, link)){
            updateWord(lang, link, val, record, function(data){
                data.forEach(function(word){
                    if(word.version == 0){
                        $('#tv_' + key).text(word.word);
                        $scope.checkWord(lang, link);


                        w.duplicity = false;
                        duplicityLoading.unshift(link);
                        loadDuplicity($scope.location);

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


    $scope.showLeo = function(lang, link){

        console.log('showSeznam', lang, link);

        $scope.isSeznamShowed = true;

        var word= getWordByLink(link);

        if(word){
            var langVal = 1;
            var wordTxt;
            if(word.l1 == 'de'){
                wordTxt = word.o1;
            } else {
                wordTxt = word.o2;
            }

            /*if(lang != 'de'){
                langVal = 1;
            }*/

            var url = 'http://dict.leo.org/ende/index_de.html#/search='+wordTxt+'&searchLoc='+langVal+'&resultOrder=basic&multiwordShowSingle=on';
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
                    word.image = IMAGE_DIR + cd.image;
                    return;
                }

            }

        });
    }

    $scope.deleteImg = function(link){

        var modalDialog = $('#modal-from-dom');

        modalDialog.find('#yesbutton').click(function(event) {
            deleteImg(link, function(data){
                var word = getWordByLink(link);
                word.image = null;//'http://uncletim.com/store/media/ecom/prodlg/none.gif';
            });
            modalDialog.modal('hide');
        });

        modalDialog.modal('show');

//
    }

    $scope.onFileSelect = function($files, linkId) {
        console.log($files);

        $upload.upload({
            url: '/words/uploadimg', //upload.php script, node.js route, or servlet upload url
            // headers: {'headerKey': 'headerValue'}, withCredential: true,
            data: {link: linkId},
            file: $files[0]
            //fileFormDataName: myFile, //(optional) sets 'Content-Desposition' formData name for file

        }).success(function(data, status, headers, config) {
                // file is uploaded successfully

                for(var idx in data){
                    var cd = data[idx];

                    if(cd.version == 0){
                        var word = getWordByLink(linkId);
                        word.image = IMAGE_DIR + cd.image;
                        return;
                    }

                }

                console.log(data);
            }).error(function(err){
                console.log(err);
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


    function updateWord(lang,link,word, record,cb){
        var dataContainer = {
            lang : lang,
            link : link,
            word: word,
            record: record
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


    function deleteImg(link,cb){
        var dataContainer = {
            link : link
        };


        $http({
            method: 'POST',
            url: '/words/deleteimg',
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