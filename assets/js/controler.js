
function WordWebCtrl($scope, $rootScope,$http, $routeParams, dialogService, duplicityService) {
    this.params = $routeParams;

    var IMAGE_DIR = 'assets/img/';
    var WORD_STATUS = {
        CURRENT : 1,
        EDITED : 2,
        SAVING : 3,
        SAVED : 4

    };





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

    var url =  '/words/get/' + this.lesson + '/' + this.lang1 + '/' + this.lang2 + '?fields=link,word as w,lang as n,image.image as imagefile,image.thumb as imagethumb,del,description,q_status';

    $scope.loading = true;
    setTimeout(function() {
        $http({method: 'GET', url: url }).
            success(function(data, status, headers, config) {
                console.log(data);
                var tempWord = {};
                var prevWord = null;
                duplicityService.clear();

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
                        tw.duplicity = false; // HAVE TO BE false
                        duplicityService.checkDuplicity(tw);
                    }

                    addLinksForArrow(tw, prevWord);

                    tempWord[tw.link] = tw;
                    prevWord = tw;
                });

                $scope.words = tempWord;
                $scope.loading = false;

                duplicityService.loadDuplicityTimer();
            }).
            error(function(data, status, headers, config) {
                // called asynchronously if an error occurs
                // or server returns response with an error status.
                $scope.loading = false;
            });


    }, 300);

    //var url =  '/words/get/' + this.lesson + '/' + this.lang1 + '/' + this.lang2 + '?fields=link,word as w,lang as n,image.image as imagefile, image.thumb as imagethumb';


    var tempWord = [];


    function getWordByLink(link){
        return $scope.words[link];
    }


    function addLinksForArrow(word, prevWord){
        if(prevWord) {
            prevWord.nextLink = word.link;
            word.prevLink = prevWord.link;
        } else {
            word.prevLink = null;
        }
        word.nextLink = null;
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
}



