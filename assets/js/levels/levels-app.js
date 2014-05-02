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


function PlaceCtrl($scope, $routeParams, $http) {

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
    update();

    function update(){
        var url ='list/en/?fields=id,name,posx,posy';
        requestGET($http, url, function(response, status){
            console.log(response);
            $scope.places = response;

            $scope.places.forEach(function(pl){

                var item = $('<div>' + pl.id + '</div>').addClass('place');

                var left = parseFloat(1350) * parseFloat(pl.posx);
                var top = parseFloat(675) * parseFloat(pl.posy);

                item.css({top: top, left: left});
                item.appendTo(element);
                item.click(function(){
                    console.log('click');
                    $scope.$apply(function(){
                        $location.path('/place/'+pl.id);
                    })

                })

                console.log(pl, top, left, parseFloat(element.width()) , parseFloat(element.height()));
                //$('#world-main').append('ahoj').addClass('place');
            });
        });
    }



    element.dblclick(function(evt){

        var x = evt.pageX - element.offset().left;
        var y = evt.pageY - element.offset().top;

        var portX = parseFloat(x)/parseFloat(element.width());
        var portY = parseFloat(y)/parseFloat(element.height());
        alertify.prompt('portX:'+portX+ ' - protY:'+portY, function(e, placeName){
            if(e){
                var url = 'create/';
                requestPOST($http, url, {posx:portX, posy:portY, name:placeName}, function(response, status){
                    console.log(response)

                    update();
                    $location.path('/place/'+response.id);
                });


                console.log(' $location.path(/place/0)');
            }
        });

    });

}



function PlacesCtrl($scope, $http) {
    var url ='list/en/?fields=id,name,posx,posy';

    requestGET($http, url, function(response, status){
        console.log(response);
        $scope.places = response;
    });
}
