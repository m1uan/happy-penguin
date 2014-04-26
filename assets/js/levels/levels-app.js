var app = angular.module('voc4u', ['ngRoute'],
    function($routeProvider, $locationProvider) {

        $routeProvider.when('/world', {
            templateUrl: '/templates/levels/world',
            controller: WorldCtrl
        });

        $routeProvider.when('/place/:id', {
            templateUrl: '/templates/levels/place',
            controller: PlaceCtrl
        });

        $routeProvider.otherwise( {
            redirectTo: '/world'
        });


        // configure html5 to get links working on jsfiddle
        //$locationProvider.html5Mode(true);
    });




function MainCtrl($scope) {

}


function PlaceCtrl($scope) {

}

function WorldCtrl($scope, $location, $http) {
    var element = $('#world-main');
    //console.log(element);
//    element.mousemove(function(evt) {
//        var x = evt.pageX - element.offset().left;
//        var y = evt.pageY - element.offset().top;
//
//        var portX = parseFloat(x)/parseFloat(element.width());
//        var portY = parseFloat(y)/parseFloat(element.height());
//        console.log({x:x, y:y, portX:portX, portY:portY});
//    });

    //element.click(onClick);




    $scope.onWorldClick = function(evt){

        var x = evt.pageX - element.offset().left;
        var y = evt.pageY - element.offset().top;

        var portX = parseFloat(x)/parseFloat(element.width());
        var portY = parseFloat(y)/parseFloat(element.height());
        alertify.confirm('portX:'+portX+ ' - protY:'+portY, function(e){
            if(e){
                var url = 'get/en/?fields=link,key,desc,data,group'
                    + '&lastUpdateFirst=true'
                    + '&type=api';
                requestGET($http, url, function(response, status){
                    $location.path('/place/'+portX);
                });


                console.log(' $location.path(/place/0)');
            }
        });

    };

}
