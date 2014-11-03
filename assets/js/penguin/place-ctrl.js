function PlaceCtrl($scope, $http, $routeParams, placeFactory,  worldFactory, $location,$timeout){


    var placeId = $routeParams.placeid;
    var place;

    placeFactory.setupPlace(placeId, function(successPlace){
        place = successPlace;
    });



    track("Place", {placeId: placeId});

}