app.directive('myCustomer', function () {
    return {
        restrict: 'A',   // 'A' is the default, so you could remove this line
        scope: {
            word: '=word'
        },
        controller: function($rootScope, $scope){
            $scope.deleteLinks = function(links){
                $rootScope.showConfirmDialog('Delete word!', 'Are you sure about delete word?', function(){
                    deleteLinks(links);
                });
            }

            $scope.deleteImg = function(link){
                $rootScope.showConfirmDialog('Delete image', 'Are you sure about delete image?', function(){
                    deleteImg(link, function(data){
                        $scope.$apply(function(){
                            var word = getWordByLink(link);
                            word.image = null;//'http://uncletim.com/store/media/ecom/prodlg/none.gif';
                        });


                    });
                });

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