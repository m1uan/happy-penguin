var app = angular.module('voc4u', ['ngRoute'],
    function($routeProvider, $locationProvider) {

        $routeProvider.when('/world', {
            templateUrl: '/templates/levels/world',
            controller: WorldCtrl
        });

        $routeProvider.when('/places', {
            templateUrl: '/templates/levels/places',
            controller: PlacesCtrl
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


function PlaceCtrl($scope, $routeParams, $http, $timeout, $window) {

    var self = {};
    self.id = $routeParams.id;

    dragImage($('#uploader'), $('#uploader'), $('#uploader'), self.id, {UPLOAD_URL:'uploadimg/',UPLOADURL_URL:'saveimgurl/', callback : function(err, data){
        if(err){
            alert(err.responseText);
        } else {

            uploadImageSuccess(data);
        }
    }});

    $scope.update = function(){
        var updateData = {
            id : self.id,
            posx : $scope.posx,
            posy : $scope.posy,
            name : $scope.name,
            info : $scope.info
        }

        console.log('updateData',updateData);
        requestPOST($http, 'update/', updateData, function(response, status){
            console.log(response);
            fillScopeFromResponse(response);
        });
    }

    $scope.deleteInfo = function(){

        alertify.confirm('are you sure about remove text in all translations?',function(e){
            if(!e){
                return;
            }

            var updateData = {
                id : self.id
            }

            console.log('deleteInfo',updateData);
            requestPOST($http, 'deleteinfo/', updateData, function(response, status){
                console.log(response);
                $scope.info = (response.info? response.info : '');
            });
        });
    }

    $scope.delete = function(){
        alertify.confirm('are you sure about remove whole place? with images',function(e){
            if(!e){
                return;
            }
            $timeout(function(){
        alertify.confirm('are you sure about remove whole place? with images',function(e){
            if(!e){
                return;
            }
            var updateData = {
                place_id : self.id
            }

            console.log('updateData',updateData);
            requestPOST($http, 'delete/', updateData, function(response, status){
                $window.history.back();
            });
        });
            }, 1000);
        });
    }


    var url ='get/'+self.id+'?fields=id,name,info,posx,posy&qfields=qid,question,answers&ifields=iid,image';

    requestGET($http, url, function(response, status){
        console.log(response);
        fillScopeFromResponse(response);

    });


    function fillScopeFromResponse(response){
        $scope.info = (response.info? response.info : '');
        $scope.name = response.name;
        $scope.posx = response.posx;
        $scope.posy = response.posy;
        $scope.questions = response.questions;
        $scope.images = response.images;
    }


    $scope.qAdd = function(){
        var dataConteiner = {
            place_id: self.id,
            question: $scope.add_question,
            answers: $scope.add_answers}
        requestPOST($http, 'qadd/',dataConteiner, function(response, status){
            console.log(response);
            $scope.add_question = '';
            $scope.add_answers = '';
            $scope.questions.push(response);
        });
    }

    $scope.qUpdate = function(question){
        var dataConteiner = {
            qid: question.qid,
            question: question.question,
            answers: question.answers};

        requestPOST($http, 'qupdate/',dataConteiner, function(response, status){
            console.log(response);
            question.question = response.question;
            question.answers = response.answers;
        });
    }

    $scope.qDelete = function(question, index){
        var dataConteiner = {
            qid: question.qid,
            place_id: self.id
        };

        alertify.confirm('are you sure about remove it?',function(e){
            if(!e){
                return;
            }

            requestPOST($http, 'qdelete/',dataConteiner, function(response, status){
                console.log(index, response);
                $scope.questions.splice(index, 1);
            });
        });

    }

    $scope.onDeleteImage = function(image, index){
        var dataConteiner = {
            iid: image.iid,
            place_id: self.id
        };

        alertify.confirm('are you sure about remove image?',function(e){
            if(!e){
                return;
            }

            requestPOST($http, 'idelete/',dataConteiner, function(response, status){
                console.log(index, response);
                $scope.images.splice(index, 1);
                alertify.error('Image delete ' + response[0]);
            });
        });
    }

    function uploadImageSuccess(imageData){
        var image = {
            image : imageData.response.imageFile,
            iid : imageData.response.imageId
        };


        $scope.$apply(function(){
            $scope.images.push(image);
        })
        alertify.success('Image upload like ' + imageData.response.imageFile);
    }
}

function WorldCtrl($scope, $location, $http) {
    var element = $('#world-main');
    var map = null;
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


    function update(){
        var url ='list/en/?fields=id,name,posx,posy';
        requestGET($http, url, function(response, status){
            console.log(response);

            var markers = [];
            response.forEach(function(pl){
                var marker = {latLng: [pl.posx, pl.posy], name: pl.name, style: {r: 8, fill: 'yellow'}};
                markers.push(marker);
                //map.addMarker(''+pl.id, marker);
                //$('#world-main').append('ahoj').addClass('place');
            });

            map.addMarkers(markers);
        });
    }





    function createPoint(portX, portY, code){
        alertify.prompt('portX:'+portX+ ' - protY:'+portY + ' - code:' + code, function(e, placeName){
            if(e){
                var url = 'create/';
                requestPOST($http, url, {posx:portX, posy:portY, name:placeName, 'code': code}, function(response, status){
                    console.log(response)

                    update();
                    $location.path('/place/'+response.id);
                });


                console.log(' $location.path(/place/0)');
            }
        });
    }


        /* var markers = [
                [0.5, 0.5],
                {latLng:[49.5, 17.3]},
                {latLng: [40.66, -73.56], name: 'New York City', style: {r: 8, fill: 'yellow'}},
                {latLng: [41.52, -87.37], style: {fill: 'red', r: 10}}
            ],
            values1 = [1, 2, 3, 4],
            values2 = [1, 2, 3, 4];*/

    jQuery(function(){
        element.vectorMap({
            onRegionClick:function(event, code, imap,e){
                console.log('region-over', e, code,imap);
                //var v = map.getMarkerPosition(markers[2]);
                var offset = element.offset();
                var px = Math.floor(e.clientX - offset.left);
                var py = Math.floor(e.clientY - offset.top);

                var latlng = imap.pointToLatLng(px, py);
                console.log('v x y', latlng);

                createPoint(latlng.lat, latlng.lng, code);
            },onMarkerClick:function(event, marker, over){
                console.log('region-over', event, marker, over);
                var item  = $('<img src="assets/img/pinguin/penguin_3.png"/>');
                item.appendTo(event.target);
                //event.target.add('<div>ahoj</div>');

            },onViewportChange : function(e1,e2,e3,e4){
                //console.log('onViewportChange', e1, e2, e3, e4);
                /*e2.repositionMarkers();
                var v = e2.getMarkerPosition(markers[2]);
                console.log(e2, v);

                var item = $('#penguin2');

                if(!item.length){
                    item  = $('<img id="penguin2" src="assets/img/pinguin/penguin_3.png"/>');
                    item.appendTo(jQuery('#world-map'));
                }

                item.css({top: v.y +40, left: v.x-12});*/
                if(!map){
                    map = e2;
                    update();
                }
            },
            /* markers:markers, */
            backgroundColor: '#8888ff',
            borderColor: '#000',
            borderOpacity: 0.9,
            borderWidth: 30,
            color: '#f4fff0',
            markersSelectable: true,
            markersSelectableOne: true,
            focusOn: {
                x: 0.5,
                y: 0.5,
                scale: 2
            },map: 'world_mill_en',series: {
                regions: [{
                    values: {
                        "CZ":'#22FF22',
                        "DE":2
                    }
                }]
            }});

        //update();
    })

}



function PlacesCtrl($scope, $http) {
    var url ='list/en/?fields=id,name,posx,posy';

    requestGET($http, url, function(response, status){
        console.log(response);
        $scope.places = response;
    });
}
