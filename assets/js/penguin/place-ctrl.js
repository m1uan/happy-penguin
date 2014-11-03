function PlaceCtrl($scope, $http, $routeParams, placeFactory,  worldFactory, $location,$timeout){


    var placeId = $routeParams.placeid;
    var place;

    $scope.wordsLoading = true;

    placeFactory.setupPlace(placeId, function(successPlace){
        $scope.place = successPlace;
        $scope.wordsLoading = false;

        $('.main-view').css({'background-image':'url(/assets/img/orig/'+successPlace.preview+')'});
    });



    track("Place", {placeId: placeId});

}