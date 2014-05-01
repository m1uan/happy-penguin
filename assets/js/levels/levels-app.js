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


function PlaceCtrl($scope, $routeParams, $http) {

    var self = {};
    self.id = $routeParams.id;

    dragImage($('#uploader'), $('#uploader'), $('#uploader'), self.id, {UPLOAD_URL:'uploadimg/', callback : function(err, data){
        if(err){
            alert(err.responseText);
        } else {

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

    function uploadImageSuccess(imageData){
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




    $scope.onWorldClick = function(evt){

        var x = evt.pageX - element.offset().left;
        var y = evt.pageY - element.offset().top;

        var portX = parseFloat(x)/parseFloat(element.width());
        var portY = parseFloat(y)/parseFloat(element.height());
        alertify.prompt('portX:'+portX+ ' - protY:'+portY, function(e, placeName){
            if(e){
                var url = 'create/';
                requestPOST($http, url, {posx:portX, posy:portY, name:placeName}, function(response, status){
                    console.log(response)


                    $location.path('/place/'+response.id);
                });


                console.log(' $location.path(/place/0)');
            }
        });

    };

}
