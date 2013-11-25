app.directive('myCustomer', function () {
    return {
        restrict: 'A',   // 'A' is the default, so you could remove this line
        scope: {
            word: '=word'
        },
        controller: function($rootScope, $scope){
            var dialogCtrl = $scope;

            $scope.deleteLinks = function(links){
                dialogCtrl.showConfirmDialog('Delete word!', 'Are you sure about delete word?', function(){
                    deleteLinks(links);
                });
            }

            $scope.deleteImg = function(link){
                dialogCtrl.showConfirmDialog('Delete image', 'Are you sure about delete image?', function(){
                    deleteImg(link, function(data){
                        $scope.$apply(function(){
                            var word = getWordByLink(link);
                            word.image = null;//'http://uncletim.com/store/media/ecom/prodlg/none.gif';
                        });


                    });
                });
            }


            showDialogById = function(dialogId, yesevent) {
                var modalDialog = $(dialogId);

                modalDialog.find('#yesbutton').click(function(event) {
                    yesevent(event);
                    modalDialog.modal('hide');
                });

                modalDialog.modal('show');

                return modalDialog;
            }

            $scope.showConfirmDialog = function(title, message, yesevent){
                var modalDialog = showDialogById('#modal-from-dom', yesevent);

                modalDialog.find('#warning_dialog_title').text(title);
                modalDialog.find('#warning_dialog_message').text(message);
            }
        },
        templateUrl : 'templates/word-row',
        link: function(scope, elemnt, attr){
            scope.word.o1 =  scope.word.w1;
            scope.word.o2 =  scope.word.w2;
            scope.lang1 =  scope.word.n1;
            scope.lang2 =  scope.word.n2;
        }
    };
});