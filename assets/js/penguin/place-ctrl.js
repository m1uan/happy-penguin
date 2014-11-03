function PlaceCtrl($scope, $http, $routeParams, placeFactory,  worldFactory, $location,$timeout){


    var placeId = $routeParams.placeid;
    var place;

    $scope.wordsLoading = true;

    placeFactory.setupPlace(placeId, function(successPlace){
        $scope.place = successPlace;
        $scope.wordsLoading = false;
    });



    track("Place", {placeId: placeId});

}