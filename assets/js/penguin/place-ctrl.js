function PlaceCtrl($scope, $http, $routeParams, placeFactory,  worldFactory, $location,$timeout){


    var place;

    $scope.wordsLoading = true;


    function prepare(){
        var successPlace = worldFactory.getCurrentPlace();

        if(!successPlace){
            // in first load, the places are loaded by WordlCtrl
            // the places may not loaded yet, so try later
            $timeout(prepare, 488);
        } else {
            $scope.place = successPlace;
            $scope.wordsLoading = false;
            $('.main-view').css({'background-image':'url(/assets/img/orig/'+successPlace.preview+')'});
        }
    }



    prepare();



}