app.directive('myCustomer', function () {
    return {
        restrict: 'A',   // 'A' is the default, so you could remove this line
        scope: {
            word: '=word'
        },
        controller: function($rootScope, $scope, dialogService, wordService){

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
        templateUrl : 'templates/word-row',
        link: function(scope, elemnt, attr){
            scope.word.o1 =  scope.word.w1;
            scope.word.o2 =  scope.word.w2;
            scope.lang1 =  scope.word.n1;
            scope.lang2 =  scope.word.n2;
        }
    };
});