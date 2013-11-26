app.directive('myCustomer', function () {
    return {
        restrict: 'A',   // 'A' is the default, so you could remove this line
        scope: {
            word: '=word'
        },
        link: function(scope, element, attrs) {
            var el = angular.element(element);
            el.css('color','blue');
            //console.log(el);

            var im = el.find('img');
            var inp = el.find('input');
            //console.log(attrs);



            //console.log('link', linkId, im, inp);
            dragImage(im, inp, scope.word.link);


            //console.log('im', attrs.id);
            //console.log('element', attrs('id'));
            if (scope.$last){
                //
                $('#all_words_here').removeClass('hide');
                //$('#all_words_here').fadeIn();
                //window.alert("im the last!");
            }

            scope.word.o1 =  scope.word.w1;
            scope.word.o2 =  scope.word.w2;
            scope.lang1 =  scope.word.n1;
            scope.lang2 =  scope.word.n2;
        },
        controller: function($rootScope, $scope, dialogService, wordService){

            $scope.updateWord = function(lang, link) {
                var key = lang + '_' + link;
                var val = $('#ed_' + key).val();


                var w = $scope.word;
                var record = 'sfsdfs'; //generateRecord(w, lang);
                console.log(lang,link);
                // upload just in case the word is changed
                if($scope.checkWord(lang, link)){
                    wordService.updateWord(lang, link, val, record, function(data){
                        data.forEach(function(word){
                            if(word.version == 0){
                                $('#tv_' + key).text(word.word);
                                $scope.checkWord(lang, link);


                                w.duplicity = false;
                                //duplicityLoading.unshift(getWordByLink(link));
                                //loadDuplicity($scope.location);

                                return;
                            }
                        })

                    });
                }

                var key2 = lang + '_' + (link+1);
                $('#ed_' + key2).focus();

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
        },
        templateUrl : 'templates/word-row'
    };
});


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

