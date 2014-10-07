var app = angular.module('voc4u', ['ngRoute','milan.levels.factory'],
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

        $routeProvider.when('/infos', {
            templateUrl: '/templates/levels/infos',
            controller: InfosCtrl
        });

        $routeProvider.when('/info/:id', {
            templateUrl: '/templates/levels/info',
            controller: InfoCtrl
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

    $scope.add_question_type = 0;

    dragImage($('#uploader'), $('#uploader'), $('#uploader'), self.id, {UPLOAD_URL:'uploadimg/',UPLOADURL_URL:'saveimgurl/', callback : function(err, data){
        if(err){
            alert(err.responseText);
        } else {

            uploadImageSuccess(data);
        }
    }});

    $scope.changePlaceInfo= function(){
        console.log('placeChange');
        if($scope.info || $scope.name){
            alertify.confirm('There are old info and name, are you sure with remove it', function(e){
                if(e){
                    $scope.update();
                    alertify.success('ok');

                } else {
                    $scope.place_info = 1;
                }
            });
        } else {
            $scope.update();
        }
    }

    $scope.update = function(){
        var updateData = {
            id : self.id,
            posx : $scope.posx,
            posy : $scope.posy,
            place_info : $scope.place_info
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


    var url ='get/'+self.id+'?fields=id,name,info,place_info,posx,posy,preview_iid&qfields=qid,question,answers,type&ifields=iid,image';

    requestGET($http, url, function(response, status){
        console.log(response);
        fillScopeFromResponse(response);
        updateInfos();
    });




    function updateInfos(){
        requestGET($http, 'infos/?fields=pi,name,type&timestamp=' + new Date().getTime(), function(response, status){
            $scope.infos = response;

            $scope.infos.forEach(function(info){
                info.text = info.name + ' [' + info.type + ']';
            })

        })
    };

    function fillScopeFromResponse(response){
        //$scope.info = (response.info? response.info : '');
        $scope.place_info = response.place_info;
        $scope.name = response.name;
        $scope.info = response.info;
        $scope.posx = response.posx;
        $scope.posy = response.posy;
        $scope.questions = response.questions;
        $scope.images = response.images;
        $scope.preview_iid = response.preview_iid;
    }


    $scope.qAdd = function(){
        var dataConteiner = {
            place_id: self.id,
            question: $scope.add_question,
            answers: $scope.add_answers,
            type: $scope.add_question_type}
        requestPOST($http, 'qadd/',dataConteiner, function(response, status){
            console.log(response);
            $scope.add_question = '';
            $scope.add_answers = '';
            $scope.add_question_type = 0;
            $scope.questions.push(response);
        });
    }

    $scope.qUpdate = function(question){
        var dataConteiner = {
            qid: question.qid,
            question: question.question,
            answers: question.answers,
            type: question.type};

        requestPOST($http, 'qupdate/',dataConteiner, function(response, status){
            console.log(response);
            question.question = response.question;
            question.answers = response.answers;
            question.type = response.type;
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

    $scope.onPrimaryImage = function(image, index){
        var dataConteiner = {
            preview_iid: image.iid,
            place_id: self.id
        };

            requestPOST($http, 'imagepreview/',dataConteiner, function(response, status){
                console.log(index, response);
                $scope.preview_iid = response.preview_iid;
                alertify.error('Image set to primary ' + response.preview_iid);
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
    var self = {};
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


    requestGET($http, 'infotypes/?fields=pit,name', function(response, status){
        console.log(response);
        self.types = response;
        updateInfos();
    });



    function updateInfos(){
        requestGET($http, 'infos/?fields=pi,name,type&timestamp=' + new Date().getTime(), function(response, status){
            self.infos = response;

        })
    };

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
        var text = '<div>portX:'+portX+ ' - protY:'+portY + ' - code:' + code +'<div>'
            + '<div><input id="crate-point-name" ><select id="crate-point-type">';
        self.types.forEach(function(type){
           text += '<option  value="'+type.pit+'">[' + type.name +']</option>';
        });

        text += '</select></div><i>if is name empty will be created by info</i>';
        text += '<div><select id="crate-point-info">';
        self.infos.forEach(function(info){
            text += '<option value="'+info.pi+'">' + info.name +' ['+info.type+']</option>';
        });
        text += '</select></div>';

        alertify.confirm(text, function(e, placeName){
            if(e){
                // if is name empty, it will create by info
                var name = $('#crate-point-name').val();
                var type = $('#crate-point-type').val();
                var info = $('#crate-point-info').val();
                var url = 'create/';
                requestPOST($http, url, {posx:portX, posy:portY, 'name':name, 'type': type, 'info': info, 'code': code}, function(response, status){
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



