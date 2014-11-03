function PlaceCtrl($scope, $http, $routeParams,  worldFactory, $location,$timeout){


    var placeId = $routeParams.placeid;

    var prevPlace = worldFactory.getCurrentPlace();
    var place;

    if(prevPlace.id != placeId){

        worldFactory.loadPlaces(function(places, placesIds){
            place = placesIds[placeId];
            // test if is possible to move
            if(worldFactory.isPossibleToMoveWithMessage(place)){
                // set place and recount distances and prices
                worldFactory.setPlace(place);
                worldFactory.setupPlacesDistancesAndExp();
            } else {
                // $apply is already in process
                $timeout(function(){
                    $location.path('/world');
                }, 1)
            }
        });
    } else {
        place = prevPlace;
    }





    track("Place", {placeId: placeId});

}