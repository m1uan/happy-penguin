

function StatsCtrl($scope, $http, $location) {
    $scope.user = 'milan';

    $scope.param = null;
    $scope.userId = null;
    $scope.extra = null;

    $scope.lessons = [];

    $scope.$on('$locationChangeSuccess', function () {
        parseLocation($location.path());
        console.log('$locationChangeSuccess changed!', $location.path());

        if($scope.param='stat' && $scope.usr){


        }

        loadStats();
    });



    function parseLocation(location){

        if(location.indexOf('/') == 0){
            location = location.substring(1);
        }

        var lp = location.split('/');


        $scope.param = lp[0];
        $scope.userId = lp[1];
        $scope.extra = lp[2];
    }

    function loadStats(){
        $scope.loading = true;
        $http({method: 'GET', url: '/stats/' + $scope.userId }).
            success(function(data, status, headers, config) {
                console.log(data)
                $scope.lessons = {};
                data.forEach(function(val, idx){
                   val.detail = {show: false, data:[]};

                   $scope.lessons[val.lesson] = val;
                });





                $scope.userName = $scope.user = {name : $scope.userId};

            }).
            error(function(data, status, headers, config) {
                // called asynchronously if an error occurs
                // or server returns response with an error status.
                $scope.loading = false;
            });
    }

    $scope.showDetail = function(lesson){
        var lessonDetail = $scope.lessons[lesson].detail;
        if(lessonDetail.show){
            lessonDetail.show = false;
            return ;
        }
        $http({method: 'GET', url: '/stats/' + $scope.userId + '/' + lesson }).
            success(function(data, status, headers, config) {


                console.log(data[0])
                lessonDetail.data = parseDetailData(data[0]);
                lessonDetail.show = true;
                console.log(lessonDetail.data)




                $scope.userName = $scope.user = {name : $scope.userId};

            }).
            error(function(data, status, headers, config) {
                // called asynchronously if an error occurs
                // or server returns response with an error status.

            });
        //alert(lesson);
    }

    function parseDetailData(data){
        var details = {};

        data.forEach(function(obj, idx){
            var detail;
            // change vs. orig
            var co;

            if(details[obj.link]){
                detail = details[obj.link];
            } else {
                detail = {
                    link : obj.link
                    , change : {}
                    , orig : {}
                };
            }

            // get is my change or before
            if(obj.usr == $scope.userId){
                co = detail.change;
            } else {
                co = detail.orig;
            }

            if(obj.word && obj.lang){
                co['word'] = obj.word;
                co['lang'] = obj.lang;
            }

            if(obj.image){
                co['image'] = '/assets/img/orig/' + obj.image;
            }

            //if(obj.lang){

            //}

            if(obj.record){
                co['record'] = obj.record;
            }

            details[obj.link] = detail;
        });

        return details;
    }

    $scope.haveChangedImage = function(detail){
        //console.log('have' + detail);
        if(detail.link == 1179){
            console.log(detail);
        }
        return detail.orig.image != detail.change.image;
    }

}