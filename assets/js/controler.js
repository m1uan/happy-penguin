
function WordWebCtrl($scope, $rootScope,$http, $routeParams, dialogService) {
    this.params = $routeParams;

    var IMAGE_DIR = 'assets/img/';
    var WORD_STATUS = {
        CURRENT : 1,
        EDITED : 2,
        SAVING : 3,
        SAVED : 4

    };



    var duplicityLoading = [];

    //$scope.lesson = ['lesson', 'lang 1' , 'lang 2'];
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

    this.lesson = this.params.lesson;
    this.lang1 = this.params.lang1;
    this.lang2 = this.params.lang2;

    var url =  '/words/get/' + this.lesson + '/' + this.lang1 + '/' + this.lang2 + '?fields=link,word as w,lang as n,image.image as imagefile,image.thumb as imagethumb,del,description';

    $scope.loading = true;
    setTimeout(function() {
        $http({method: 'GET', url: url }).
            success(function(data, status, headers, config) {
                console.log(data);
                tempWord = {};
                duplicityLoading = [];

                data.forEach(function(tw){


                    if(tw.thumbfile){
                        tw.imagefile = 'assets/img/thumb/' + tw.thumbfile;
                    } else if(tw.imagefile) {
                        tw.imagefile = 'assets/img/orig/' + tw.imagefile;
                    }


                    // for removed not loading any duplicities
                    if(tw.del){
                        tw.duplicity = true;
                    } else {
                        // duplicity loading
                        tw.duplicity = [tw]; // HAVE TO BE false
                        duplicityLoading.push(tw);
                    }

                    tempWord[tw.link] = tw;
                });

                $scope.words = tempWord;
                $scope.loading = true;

                //loadDuplicityTimer();
            }).
            error(function(data, status, headers, config) {
                // called asynchronously if an error occurs
                // or server returns response with an error status.
                $scope.loading = false;
            });


    }, 300);

    //var url =  '/words/get/' + this.lesson + '/' + this.lang1 + '/' + this.lang2 + '?fields=link,word as w,lang as n,image.image as imagefile, image.thumb as imagethumb';


    var tempWord = [];

    function loadDuplicity() {
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

        var langs = [$routeParams.lang1, $routeParams.lang2];
        var changeLang = $routeParams.lesson;

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

        console.log('onRow', onRow, links);

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
                    loadDuplicityTimer();

                }).
                error(function(data, status, headers, config) {
                    loadDuplicityTimer();
                });
        }

        function dataToDuplicies(dataOnIdx, link){
            console.log(dataOnIdx, link, $scope.words[link].duplicity);
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
                //console.log(dataOnIdx, link, $scope.words[link].duplicity);

                console.log(link, $scope.words[link].duplicity);
            }
            $rootScope.$broadcast('duplicity');

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


    function loadDuplicityTimer(){


        setTimeout(function(){
            loadDuplicity();
        }, 10);
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






    $scope.focusWord = function(lang, link){

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

    $scope.new_word_d = '';
    $scope.new_word_w1 = '';
    $scope.new_word_w2 = '';

    $scope.showAddWord = function(){
        console.log('assets/img/flags/flag_'+$scope.lang1+'.png') ;
        var modalDialog = dialogService.showDialogById('#modal-add-word', function(){
            //modalDialog.find('')
            var dataContainer = {'word' : {
                s : $routeParams.lesson,
                w1 : $scope.new_word_w1,
                w2 : $scope.new_word_w2,
                d : $scope.new_word_d,
                n1 : $routeParams.lang1,
                n2 : $routeParams.lang2,
                r1 : '|'+$routeParams.lang2+'|' +$scope.new_word_w2,
                r2 : '|'+$routeParams.lang1+'|' +$scope.new_word_w1
            }};

            if(!$scope.new_word_d || !$scope.new_word_w1 || !$scope.new_word_w2){
                alert('sorry all imput box must contain a value ;-)')
                return true;
            }


            $http({
                method: 'POST',
                url: '/words/addword',
                data: dataContainer}).
                success(function(data, status, headers, config) {
                    console.log(data, $scope.words);

                    var newWord = {
                        l1 : data.w1[0].lang,
                        w1 : data.w1[0].word,
                        o1 : data.w1[0].word,
                        l2 : data.w2[0].lang,
                        w2 : data.w2[0].word,
                        o2 : data.w2[0].word,
                        link : data.l,
                        description : data.d,
                        del :0,
                        imagefile : null,
                        duplicity : false
                    }

                    $scope.words[newWord.link] = newWord;

                    duplicityLoading.unshift(newWord);
                    loadDuplicity($scope.location);

                    $scope.new_word_d = '';
                    $scope.new_word_w1 = '';
                    $scope.new_word_w2 = '';
                    //cb(data);
                }).
                error(function(data, status, headers, config) {
                    // called asynchronously if an error occurs
                    // or server returns response with an error status.
                });
        });

        modalDialog.find('#add_word_icon1').attr('src','assets/img/flags/flag_'+$routeParams.lang1+'.png');
        modalDialog.find('#add_word_icon2').attr('src','assets/img/flags/flag_'+$routeParams.lang2+'.png');
    }
}



