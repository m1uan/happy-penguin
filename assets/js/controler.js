var app = angular.module('words',['angularFileUpload']);

//lscache.flush();
//http://voc4u-miuan.rhcloud.com/#/1001/de/es

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
        //console.log(el);

        var im = el.find('img');
        var inp = el.find('input');
        //console.log(attrs);

        var linkId  = attrs.id.split('_')[0];

        //console.log('link', linkId, im, inp);
        dragImage(im, inp, linkId);


        //console.log('im', attrs.id);
        //console.log('element', attrs('id'));
        if (scope.$last){
            $('#all_words_here').fadeOut();
            $('#all_words_here').removeClass('hide');
            $('#all_words_here').fadeIn();
            //window.alert("im the last!");
        }
    };
})  ;

function WordWebCtrl($scope, $rootScope,$http, $location, $upload) {
    var IMAGE_DIR = 'assets/img/';
    var WORD_STATUS = {
        CURRENT : 1,
        EDITED : 2,
        SAVING : 3,
        SAVED : 4

    };

    $scope.lang1 = '';
    $scope.lang2 = '';

    $scope.loading = false;

    $scope.languages =['cs', 'de','en', 'es','fr','it','pt','ru','sr','zh']


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
        var maxDuplicityOnRow = 10;

        if(duplicityLoading.length < 1) {
            return;
        }

        var onRow = [];
        var links = [];

        var langs = [$scope.lang1, $scope.lang2];
        var changeLang = langs[0];

        // #00000001
        // lang are sort alphabeticaly for caching result
        // example:
        // 	 ["cs","de"] or ["de","cs"]
        //	allways will be request like ["cs","de"]
        langs = langs.sort();
        changeLang = langs[0] != changeLang;

        onRow.push(langs);

	// +1 because onRow already are the langs
        while(duplicityLoading.length > 0 && onRow.length < maxDuplicityOnRow +1) {
            //console.log('ahoj',duplicityLoading[0]);
            var word =  duplicityLoading.shift();
            //console.log('ahoj2',word,duplicityLoading);
            //var word = getWordByLink(wordLink);

            var onRowData = null;

            // langs was changed in #00000001 alphabeticaly
            if(changeLang){
                onRowData = [word.w2.toLowerCase(), word.w1.toLowerCase()];
            } else {
                onRowData = [word.w1.toLowerCase(), word.w2.toLowerCase()];
            }

            var storageKey = generateStorageKey(langs, onRowData);
            // try re-store data from local data file
            // https://github.com/pamelafox/lscache
            var cachedData = lscache.get(storageKey);

            // if the data isn't in cache please put
            // to onRow which will be load from server
            if(cachedData && typeof cachedData !== 'undefined'){
                //console.log('cachedData:', cachedData);
                dataToDuplicies(cachedData, word.link, -1);
            } else {
                onRow.push(onRowData);
                links.push({link : word.link, storageKey : storageKey});
            }


        }

        console.log(onRow);

        // if any row is in onRow - load from server
        // because everything can be previosly loaded from cache...
        if(onRow.length > 0) {
            $http.post('/words/duplicity', {links: onRow}).
                success(function(data, status, headers, config) {
                    handleData(data);
                    //$scope.$apply();
                    /***
                     *  recal duplicity with rest of duplicity list
                     * */
                    loadDuplicityTimer(location);

                }).
                error(function(data, status, headers, config) {
                    loadDuplicityTimer(location);
                });
        }

        function dataToDuplicies(dataOnIdx, link){
            if(dataOnIdx && dataOnIdx.length > 0){
                var duplicities = [];
                dataOnIdx.forEach(function(row){

                    if(changeLang) {
                        // the order of langs have been changed #00000001
                        // change the words
                        var tw1 = row.w1;
                        row.w1 = row.w2;
                        row.w2 = tw1;
                    }

                    duplicities.push(row);
                });
                $scope.words[link].duplicity = duplicities;

                //console.log(link, $scope.words[link].duplicity);
            }


        }

        function generateStorageKey(langs, row){
            var key = 'dp' + langs.join('_');
            key+= '|' + row.join('_');

            return key;
        }

        function handleData(data){
            console.log(data, links);
            // it is "na bednu" but its connection between data and links
            // the same index in links is the same index for data
            // links is conection for words
            links.forEach(function(link, idx){
                var dataOnIdx = data[idx];

                if(dataOnIdx){
                    dataToDuplicies(dataOnIdx, link.link);

                    // try re-store data from local data file
                    // https://github.com/pamelafox/lscache
                    lscache.set(link.storageKey, dataOnIdx, 60* 12* 14);
                    var cachedData = lscache.get(link.storageKey);
                    //console.log('dataOnIdx:', dataOnIdx,'cacheData:', cachedData);
                }

            });

        }

    }


    function loadDuplicityTimer(location){
        var loc = location;

        setTimeout(function(){
            loadDuplicity(loc);
        }, 10);
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
                    setupLessonAndLangs(lessonAndLang);
                    console.log(data);
                    tempWord = {};
                    duplicityLoading = [];

                    data[0].forEach(function(link){
                        if(link.version){
                           return ;
                        }

                        var tw = {

                          description : link.description,
                          link : link.lid,
                          w1 : '',
                          w2 : '',
                          del : link.del
                        }

                        if(link.thumbfile){
                           tw.imagefile = 'assets/img/thumb/' + link.thumbfile;
                        } else if(link.imagefile) {
                           tw.imagefile = 'assets/img/orig/' + link.imagefile;
                        }


                        // for removed not loading any duplicities
                        if(link.del){
                            tw.duplicity = true;
                        } else {
                            // duplicity loading
                            tw.duplicity = false;
                            duplicityLoading.push(tw);
                        }
                        tempWord[link.lid] = tw;
                    });


                    data[1].forEach(function(w){
                        if(tempWord[w.link]){
                            var l = tempWord[w.link];
                            l.w1 = w.word;
                            l.o1 = w.word;
                            l.l1 = w.lang;
                        }

                    });

                    data[2].forEach(function(w){
                        if(tempWord[w.link]){
                            var l = tempWord[w.link];
                            l.w2 = w.word;
                            l.o2 = w.word;
                            l.l2 = w.lang;
                        }
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
        console.log(lang,link);
        // upload just in case the word is changed
        if($scope.checkWord(lang, link)){
            updateWord(lang, link, val, record, function(data){
                data.forEach(function(word){
                    if(word.version == 0){
                        $('#tv_' + key).text(word.word);
                        $scope.checkWord(lang, link);


                        w.duplicity = false;
                        duplicityLoading.unshift(getWordByLink(link));
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



        var word = getWordByLink(link);

        var indicator = $('#in_' + key);

        console.log('checkWord (val:' + lang + ";" + key, word);

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

    function showDialog(title, message, yesevent){
        var modalDialog = $('#modal-from-dom');
        modalDialog.find('#warning_dialog_title').text(title);
        modalDialog.find('#warning_dialog_message').text(message);
        modalDialog.find('#yesbutton').click(function(event) {
            yesevent(event);
            modalDialog.modal('hide');
        });

        modalDialog.modal('show');
    }

    $scope.deleteImg = function(link){
        showDialog('Delete image', 'Are you sure about delete image?', function(){
            deleteImg(link, function(data){
                $scope.$apply(function(){
                    var word = getWordByLink(link);
                    word.image = null;//'http://uncletim.com/store/media/ecom/prodlg/none.gif';
                });


            });
        });


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


    $scope.deleteLinks = function(links){
        showDialog('Delete word!', 'Are you sure about delete word?', function(){
            deleteLinks(links);
        });
    }

    deleteLinks = function(links){
        $http({
            method: 'POST',
            url: '/words/deletelink',
            data: {links:links}}).
            success(function(data, status, headers, config) {

                console.log(data);
                data[0].forEach(function(dl){
                   var w = getWordByLink(dl.lid);
                    w.del = dl.del;
                });

            }).
            error(function(data, status, headers, config) {
                // called asynchronously if an error occurs
                // or server returns response with an error status.
            });
    }

    $scope.isDeleted = function(word){
        return word.del != 0;
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

    function setupLessonAndLangs(lessonAndLang){
        var l = lessonAndLang;
        if(l.indexOf('/') == 0){
            l = l.substring(1);
        }

        var langs = l.split('/');


        //$scope.lesson = langs[0];
        $scope.lang1 = langs[1];
        $scope.lang2 = langs[2];
        //console.log(lessonAndLang, lal);

    }

}
