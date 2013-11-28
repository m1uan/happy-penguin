app.service('dialogService', function($http) {

        this.showDialogById = function(dialogId, yesevent) {
            var modalDialog = $(dialogId);

            modalDialog.find('#yesbutton').one('click', function(event) {
                console.log('yes button call!');
                if(!yesevent(event)){
                    modalDialog.modal('hide');
                }

            });

            modalDialog.modal('show');

            return modalDialog;
        }

        this.showConfirmDialog = function(title, message, yesevent){
            var modalDialog = this.showDialogById('#modal-from-dom', yesevent);

            modalDialog.find('#warning_dialog_title').text(title);
            modalDialog.find('#warning_dialog_message').text(message);
        }
});


app.service('wordService', function($http) {

    this.saveImgUrl = function(link,url,cb){
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


    this.updateWord = function(lang,link,word, record,cb){
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


    this.deleteImg = function(link,cb){
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


    this.deleteLink = function(word){
        $http({
            method: 'POST',
            url: '/words/deletelink',
            data: {links:[word.link]}}).
            success(function(data, status, headers, config) {

                console.log(data);
                data[0].some(function(dl){
                    if(dl.lid == word.link){
                        word.del = dl.del;
                        return true;
                    }

                });

            }).
            error(function(data, status, headers, config) {
                // called asynchronously if an error occurs
                // or server returns response with an error status.
            });
    }

    this.updateLinkDescription = function(word, description){
        var url = '/words/updatelink/';


        $http({
            method: 'POST',
            url: url,
            data: {lid: word.link, description:description}}).
            success(function(data, status, headers, config) {
                if(word.description){
                    word.description = data[0].description;
                } else if(word.d){
                    word.d = data[0].description;
                }

            }).
            error(function(data, status, headers, config) {
                // called asynchronously if an error occurs
                // or server returns response with an error status.
            });
    }

    this.setQuestionState = function(word, state){
        var url = '/question/setstate/' + word.link + '/' + word.n1 + '/' + word.n2 + '/' + state;
        $http({
            method: 'POST',
            url: url,
            data: {message:''}}).
            success(function(data, status, headers, config) {
                word.q_state = data.word.q_state;
            }).
            error(function(data, status, headers, config) {
                // called asynchronously if an error occurs
                // or server returns response with an error status.
            });
    }
});

/***
 * PLEASE NOTE!
 * lang is comming from word
 * the lang is gettet from first word in list!!!
 */
app.service('duplicityService', function($http) {
    var duplicityService = this;

    this.duplicityLoading = [];

    this.clear = function(){
        this.duplicityLoading = [];
    }

    this.checkDuplicity = function(word, insert){
        var dl = duplicityService.duplicityLoading;
        // insert is used after update word
        if(!insert){
            dl.push(word);
        } else {
            dl.unshift(word);
            duplicityService.loadDuplicityTimer();
        }

    }

    this.loadDuplicityTimer = function(){
        setTimeout(function(){
            duplicityService.loadDuplicity();
        }, 10);
    }

    this.loadDuplicity = function() {
        var duplicityLoading = duplicityService.duplicityLoading;
        // 15 the response is ~27s (SQL LIMIT 25)
        // 75 the response is ~1:27s  (SQL LIMIT 25)
        // 2 the response is ~3s  (SQL LIMIT 6)
        // 80 the response is ~2:00s  (SQL LIMIT 6) and 502
        var maxDuplicityOnRow = 10;

        if(duplicityLoading.length < 1) {
            return;
        }

        var onRow = [];
        var loadingWords = [];

        var w1 = duplicityLoading[0];

        var langs = [w1.n1, w1.n2];
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
                dataToDuplicies(cachedData, word, -1);
            } else {
                onRow.push(onRowData);
                loadingWords.push({word : word, storageKey : storageKey});
            }


        }

        console.log('duplicityService::loadingWords', onRow, loadingWords);

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
                    duplicityService.loadDuplicityTimer();

                }).
                error(function(data, status, headers, config) {
                    duplicityService.loadDuplicityTimer();
                });
        }

        function dataToDuplicies(dataOnIdx, word){
            console.log('duplicityService::dataToDuplicies', dataOnIdx, word);
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
                word.duplicity = duplicities;
                //console.log(dataOnIdx, link, $scope.words[link].duplicity);

                //console.log(link, word.duplicity);
            }
            //$rootScope.$broadcast('duplicity');

        }

        function generateStorageKey(langs, row){
            var key = 'dp' + langs.join('_');
            key+= '|' + row.join('_');

            return key;
        }

        function handleData(data){
            console.log('duplicityService::handleData', data, loadingWords);
            // it is "na bednu" but its connection between data and links
            // the same index in links is the same index for data
            // links is conection for words
            loadingWords.forEach(function(word, idx){
                var dataOnIdx = data[idx];

                if(dataOnIdx){
                    dataToDuplicies(dataOnIdx, word.word);

                    // try re-store data from local data file
                    // https://github.com/pamelafox/lscache
                    lscache.set(word.storageKey, dataOnIdx, 60* 12* 90);
                    //var cachedData = lscache.get(word.storageKey);
                    //console.log('dataOnIdx:', dataOnIdx,'cacheData:', cachedData);
                }

            });

        }

    }
});

