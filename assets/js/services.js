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
                data.some(function(link){
                   if(link.version === 0){
                       if(word.description){
                           word.description = link.description;
                       } else if(word.d){
                           word.d = link.description;
                       }
                       return true;
                   }
                });


            }).
            error(function(data, status, headers, config) {
                // called asynchronously if an error occurs
                // or server returns response with an error status.
            });
    }

    this.setQuestionState = function(word, state, message){
        var url = '/question/setstate/' + word.link + '/' + word.n1 + '/' + word.n2 + '/' + state;
        $http({
            method: 'POST',
            url: url,
            data: {message:message}}).
            success(function(data, status, headers, config) {
                word.q_state = data.word.q_state;
            }).
            error(function(data, status, headers, config) {
                // called asynchronously if an error occurs
                // or server returns response with an error status.
            });
    }

    this.approve = function(linkId,flag,cb){
        var dataContainer = {
            flag : flag,
            linkId : linkId
        };


        $http({
            method: 'POST',
            url: '/approveimages/approve',
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

});

/***
 * PLEASE NOTE!
 * lang is comming from word
 * the lang is gettet from first word in list!!!
 */
app.service('duplicityService', function($http, $timeout) {
    var self = {};

    var waitingList = []
    var MAX_FROM_WAITING_LIST = 2000;

    var timerRun = null;

    var wordsByLink = null;

    self.check = function(word){
        waitingList.push(word);
    }

    self.loadDuplicityTimer = function(words){

        if(words){
            wordsByLink = words;
        }

        if(!timerRun){
            timerRun = $timeout(loadDuplicity, 10);
        }
    }

    var loadDuplicity = function() {
        var workList = {}
        var links = '';
        var lang,lang2;

        if(waitingList.length < 1){
            if(timerRun){
                //timerRun.stop();
            }

            timerRun = null;
            return;
        }

        waitingList.some(function(word,idx){
            if(!lang){
                lang = word.n1;
            }

            if(!lang2){
                lang2 = word.n2;
            }

            workList[word.link] = word;
            links += ',' + word.link;
            waitingList.splice(idx, 1);
            return idx == MAX_FROM_WAITING_LIST;
        })

        // remove symbol ',' from front
        links = links.substr(1);

        requestGET($http, '/words/sentences/'+lang+'/'+lang2+'/?toLinks='+links, function(response, status){

            response.toLinks.forEach(function(linkToIndex, sentenceIndex){
                var sen = response.sentences[sentenceIndex];
                linkToIndex.forEach(function(link){
                    sentenceToWord(wordsByLink[link], sen)
                })

            })
            // proces next in list
            timerRun = null;
            self.loadDuplicityTimer();
        });
    }

    function sentenceToWord(workWord, sen){
        if(!workWord.sentences){
            workWord.sentences = []
            workWord.sentencesId = []
        }

        if(workWord.sentencesId.indexOf(sen.l) == -1){
            workWord.sentences.push(sen);
            workWord.sentencesId.push(sen.l);
        }
    }

    return self;
});

app.service('lastVisitService', function($http) {

    var lastVisitService = this;

    lastVisitService.onChangeLastVisit = null;
    lastVisitService.questionsCount = 1;
    lastVisitService.questionsWhereIAMCount = 3;

    lastVisitService.QUESTION_ALL = 1;
    lastVisitService.QUESTION_WHERE_I_AM = 2;

    lastVisitService.refreshCounts = function(type, cnt){
        if(type == lastVisitService.QUESTION_ALL){
            this.questionsCount = cnt;
        } else if(type == lastVisitService.QUESTION_WHERE_I_AM){
            this.questionsWhereIAMCount = cnt;
        }

        this.onChangeLastVisit(this.questionsCount, this.questionsWhereIAMCount);
    }

    lastVisitService.getLastVisit = function(type,cb){

        lastVisitService.onChangeLastVisit = cb;

        var dataContainer = {
            type : type
        };




        $http({
            method: 'POST',
            url: '/question/getlastvisit',
            data: dataContainer}).
            success(function(data, status, headers, config) {
                console.log(data);
                lastVisitService.refreshCounts(type, data.cnt);
            }).
            error(function(data, status, headers, config) {
                // called asynchronously if an error occurs
                // or server returns response with an error status.
            });


    }

    lastVisitService.setLastVisit = function(type,cb){

        //this.onChangeLastVisit = cb;

        var dataContainer = {
            type : type
        };

        $http({
            method: 'POST',
            url: '/question/setlastvisit',
            data: dataContainer}).
            success(function(data, status, headers, config) {
                console.log(data);
                lastVisitService.refreshCounts(type, 0);
            }).
            error(function(data, status, headers, config) {
                // called asynchronously if an error occurs
                // or server returns response with an error status.
            });


    }
});