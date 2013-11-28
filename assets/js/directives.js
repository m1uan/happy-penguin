


app.directive('myWord', function () {
    return {
        restrict: 'A',   // 'A' is the default, so you could remove this line
        scope: {
            word: '=word'
        },
        link: function(scope, element, attrs) {
            var el = angular.element(element);

            //console.log(el);

            var im = el.find('img');
            var inp = el.find('input');
            //console.log(attrs);



            //console.log('link', linkId, im, inp);
            dragImage(el, im, inp, scope.word.link);


            el.hover(function () {
                focusElement(el, true);
                //console.log('hover') ;
            }, function () {
                focusElement(el, false);
                //console.log('hover-off') ;
            });

            scope.word.o1 =  scope.word.w1;
            scope.word.o2 =  scope.word.w2;
            scope.lang1 =  scope.word.n1;
            scope.lang2 =  scope.word.n2;
        },
        controller: function($rootScope, $scope, dialogService, wordService, duplicityService){

            $scope.updateWord = function(lang, link) {
                var key = lang + '_' + link;
                var val = $('#ed_' + key).val();


                var w = $scope.word;
                var record = generateRecord(w, lang);
                console.log(lang,link);
                // upload just in case the word is changed
                if($scope.checkWord(lang, link)){
                    wordService.updateWord(lang, link, val, record, function(data){
                        data.forEach(function(word){
                            if(word.version == 0){

                                if(lang == $scope.word.n1){
                                    $scope.word.o1 = word.word;
                                } else {
                                    $scope.word.o2 = word.word;
                                }

                                //$('#tv_' + key).text(word.word);
                                $scope.checkWord(lang, link);


                                w.duplicity = false;
                                duplicityService.checkDuplicity(w, true);
                                //duplicityLoading.unshift(getWordByLink(link));
                                //loadDuplicity($scope.location);

                                return;
                            }
                        })

                    });
                }


                function generateRecord(word, forLang){
                    var gr = [];

                    if(forLang == word.n1){
                        gr.push(word.o1);
                        gr.push(word.n2);
                        gr.push(word.w2);
                    } else {
                        gr.push(word.o2);
                        gr.push(word.n1);
                        gr.push(word.w1);
                    }

                    // format:
                    //      old-word|second-lang|second-lang-word
                    // max length: 50
                    return gr.join('|').substring(0,50);
                }



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



                var word = $scope.word;

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

            $scope.deleteLinks = function(links){
                dialogService.showConfirmDialog('Delete word!', 'Are you sure about delete word?', function(){
                    wordService.deleteLink($scope.word);
                });
            }

            $scope.deleteImg = function(link){
                dialogService.showConfirmDialog('Delete image', 'Are you sure about delete image?', function(){
                    wordService.deleteImg(link, function(data){
                        $scope.word.imagefile = null;//'http://uncletim.com/store/media/ecom/prodlg/none.gif';
                    });
                });
            }




            $scope.$on('duplicity', function() {
                $scope.word = $scope.$parent.words[ $scope.word.link];
                //console.log('duplicity',$scope.word.link, $scope.word.duplicity, $scope.$parent.words[ $scope.word.link].duplicity);
            });

            $scope.isSeznamShowed = false;
            $scope.showSeznam = function(lang, link){

                console.log('showSeznam', lang, link);

                $scope.isSeznamShowed = true;

                var word = $scope.word;

                if(word){
                    var langTxt;
                    var wordTxt;
                    if(word.n1 != lang){
                        langTxt = word.n1 + '-' + word.n2;
                        wordTxt = word.o2;
                    } else {
                        langTxt = word.n2 + '-' + word.n1;
                        wordTxt = word.o1;
                    }

                    langTxt = langTxt.replace('cs','cz');

                    var url = 'http://slovnik.seznam.cz/'+langTxt+'/word/?q=' + wordTxt;
                    var seznam = $('#slovnik_seznam_cz');

                    //var win = window.open(url, 'seznam_cz');
                    //win.blur();
                    var key = lang + '_' + (link);
                    var obj = $('#ed_' + key);


                    var win = window.open(url, 'seznam_name_cz');
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

                var word= $scope.word;

                if(word){
                    var langVal = 1;
                    var wordTxt;
                    if(word.n1 == 'de'){
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

                    var win = window.open(url, 'leo_name_cz');

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

                var word= $scope.word;

                if(word){
                    //var langTxt;
                    var wordTxt;
                    if(word.n1 != lang){
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

            $scope.request = function(status){
                wordService.setQuestionState($scope.word, status);
            }

            $scope.updateLink = function(word){
                var link = word.link;
                var desc = word.description;
                var w1 = word.w1;
                var w2 = word.w2;

                // compatibility with duplicity
                if(!link && word.l){
                    link = word.l;
                    // for wordService.updateLinkDescription -- he looking for word.link
                    word.link = word.l;
                }

                if(!desc && word.d){
                    desc = word.d;
                }

                console.log('assets/img/flags/flag_'+$scope.lang1+'.png') ;
                var modalDialog = dialogService.showDialogById('#modal-add-word', function(){
                    var newDesc = inputLink.val();
                    console.log('1 yes button call!');
                    if(desc != newDesc){
                        console.log(newDesc, desc);
                        wordService.updateLinkDescription(word, newDesc);
                    }


                });

                var input1 = modalDialog.find('#add_word_input1');
                var input2 = modalDialog.find('#add_word_input2');
                var inputLink = modalDialog.find('#add_word_input_desc');
                modalDialog.find('#warning_dialog_title').text('Edit link: #' + link);



                input1.attr('readonly', true);
                input1.val(w1);
                input2.attr('readonly', true);
                input2.val(w2);
                inputLink.val(desc);
                inputLink.focus();
                modalDialog.find('#add_word_icon1').attr('src','assets/img/flags/flag_'+$scope.lang1+'.png');
                modalDialog.find('#add_word_icon2').attr('src','assets/img/flags/flag_'+$scope.lang2+'.png');


            }
        },
        templateUrl : 'templates/word-row'
    };
});


app.directive('onEnter',function(){
    var move = function(currentLink, moveLink, lang){
        var wordEl = $('#word_' + currentLink);
       	if(currentLink != moveLink){
		focusElement(wordEl, false);
	}

        if(moveLink){
            var wordEl2 = $('#word_' + (moveLink));
            console.log('wordEl2', wordEl, wordEl2);
            // wordEl2.text('ahoj');
            focusElement(wordEl2, true);

            var key2 = lang + '_' + (moveLink);
            $('#ed_' + key2).focus();
        }
    }
    var linkFn = function(scope,element,attrs) {
        element.bind("keypress", function(event) {
            var keyCode = event.keyCode || event.which;
            if(keyCode === 13) {
                scope.$apply(function() {
                    console.log('enter boy',attrs);
                    scope.$eval(attrs.onEnter);


                    move(attrs.arrowlink, attrs.arrownext, attrs.arrowlang);

                });
            } else if(keyCode === 38) {   // UP
                event.preventDefault();
                move(attrs.arrowlink, attrs.arrowprev, attrs.lang);
            } else if(keyCode === 40) {   // DOWN
                event.preventDefault();
                move(attrs.arrowlink, attrs.arrownext, attrs.lang);
            } else if(keyCode === 9) {   // TAB
                event.preventDefault();
                move(attrs.arrowlink, attrs.arrownext, attrs.lang);
            }
        });
    };

    return {
        link:linkFn
    };
});

