function wordsLoader($scope, $http, url, duplicityService, callback){
    $scope.loading = true;
    setTimeout(function() {
        $http({method: 'GET', url: url }).
            success(function(data, status, headers, config) {
                console.log(data);
                var tempWord = {};
                var tempWordList = [];
                var prevWord = null;
                if(duplicityService){
                    duplicityService.clear();
                }

                $scope.undeleteWords = 0;
                $scope.imagesWords = 0;
                $scope.imagesApproved = 0;
                $scope.imagesUnderReview = 0;
                $scope.imagesRejected = 0;
                data.forEach(function(tw){






                    // for removed not loading any duplicities
                    if(tw.del){
                        tw.duplicity = true;
                    } else {
                        // duplicity loading
                        tw.duplicity = false; // HAVE TO BE false
                        if(duplicityService){
                            duplicityService.checkDuplicity(tw);
                        }
                        $scope.undeleteWords++;

                        if(tw.flag === 0){
                            $scope.imagesUnderReview++;
                        } else if(tw.flag === 2){
                            $scope.imagesRejected++;
                        } else if(tw.flag === 1){
                            $scope.imagesApproved++;
                        }

                        if(tw.imagethumb){
                            $scope.imagesWords++;
                            tw.imagefile = 'assets/img/thumb/' + tw.imagethumb;
                        } else if(tw.imagefile) {
                            $scope.imagesWords++;
                            tw.imagefile = 'assets/img/orig/' + tw.imagefile;
                        }
                    }

                    addLinksForArrow(tw, prevWord);

                    tempWord[tw.link] = tw;
                    tempWordList.push(tw);
                    prevWord = tw;
                });

                $scope.words = tempWord;
                $scope.wordList = tempWordList;
                $scope.loading = false;

                if(duplicityService){
                    duplicityService.loadDuplicityTimer();
                }

                if(callback){
                    callback();
                }
            }).
            error(function(data, status, headers, config) {
                // called asynchronously if an error occurs
                // or server returns response with an error status.
                $scope.loading = false;
                if(callback){
                    callback();
                }
            });


    }, 300);

    function addLinksForArrow(word, prevWord){
        if(prevWord) {
            prevWord.nextLink = word.link;
            word.prevLink = prevWord.link;
        } else {
            word.prevLink = null;
        }
        word.nextLink = null;
    }
}
function WordWebCtrl($scope, $rootScope,$http, $routeParams, dialogService, duplicityService) {
    this.params = $routeParams;

    var IMAGE_DIR = 'assets/img/';
    var WORD_STATUS = {
        CURRENT : 1,
        EDITED : 2,
        SAVING : 3,
        SAVED : 4

    };


    $scope.new_question = "i don't understand meaning of this word...";


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


    $scope.wordList = [];

    this.lesson = this.params.lesson;
    this.lang1 = this.params.lang1;
    this.lang2 = this.params.lang2;

    var url =  '/words/get/' + this.lesson + '/' + this.lang1 + '/' + this.lang2 + '?fields=link,word as w,lang as n,image.image as imagefile,image.thumb as imagethumb,del,description,flag';
    wordsLoader($scope, $http, url, duplicityService);


    //var url =  '/words/get/' + this.lesson + '/' + this.lang1 + '/' + this.lang2 + '?fields=link,word as w,lang as n,image.image as imagefile, image.thumb as imagethumb';


    var tempWord = [];


    function getWordByLink(link){
        return $scope.words[link];
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
                        n1 : data.w1[0].lang,
                        w1 : data.w1[0].word,
                        o1 : data.w1[0].word,
                        n2 : data.w2[0].lang,
                        w2 : data.w2[0].word,
                        o2 : data.w2[0].word,
                        link : data.l,
                        description : data.d,
                        del :0,
                        imagefile : null,
                        duplicity : false
                    }

                    $scope.words[newWord.link] = newWord;

                    $scope.words.some(function(prevWord){
                        if(!prevWord.nextLink){
                            addLinksForArrow(newWord, prevWord) ;
                            return true;
                        }
                    })

                    duplicityService.checkDuplicity(newWord, true);

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

        modalDialog.find('#add_word_input1').attr('readonly', false);
        modalDialog.find('#add_word_input2').attr('readonly', false);
        modalDialog.find('#add_word_icon1').attr('src','assets/img/flags/flag_'+$routeParams.lang1+'.png');
        modalDialog.find('#add_word_icon2').attr('src','assets/img/flags/flag_'+$routeParams.lang2+'.png');
    }

    $scope.showBtnAdd = true;
}


var QuestionsCtrl = function($scope, $http, $routeParams, duplicityService, lastVisitService){
    var url =  '/question/words/' + $routeParams.lang1 + '/' + $routeParams.lang2 ;

    if($routeParams.userId){
        url += '/' +  $routeParams.userId;
    }

    url += '?fields=link,word as w,lang as n,image.image as imagefile,image.thumb as imagethumb,del,description,@userstatus,flag';

    console.log('QuestionsCtrl', url);
    wordsLoader($scope, $http, url, duplicityService, function(){
        var url = '/question/messages/?fields=message,lang1,lang2,changed,@user';
        var links = [] ;
        for (link in $scope.words) {
           links.push(link);
        }
        if(links.length)  {
            $http({
                method: 'POST',
                url: url,
                data: {links: links}}).
                success(function(data, status, headers, config) {

                   data.forEach(function(question){
                       var word = $scope.words[question.linkId];
                       word.questions = question.messages;
                       question.messages.forEach(function(mess){
                           mess.changed = moment(mess.changed, "YYYY-MM-DD HH:mm Z","cz").calendar();
                       })

                   });

                   lastVisitService.setLastVisit($routeParams.userId ? lastVisitService.QUESTION_WHERE_I_AM : lastVisitService.QUESTION_ALL);

                   console.log('guestion',data) ;
                }).
                error(function(data, status, headers, config) {
                    // called asynchronously if an error occurs
                    // or server returns response with an error status.
                });
        }

    });




};


var ApproveImageCtrl = function($scope, $http, $routeParams, duplicityService){
    var url =  '/approveimages/words/' + $routeParams.lang1 + '/' + $routeParams.lang2 ;

    if($routeParams.userId){
        url += '/' +  $routeParams.userId;
    }

    url += '?fields=link,word as w,lang as n,image.image as imagefile,image.thumb as imagethumb,del,description,@userstatus,flag';

    console.log('ApproveImageCtrl', url);
    wordsLoader($scope, $http, url, null, function(){


    });



};



