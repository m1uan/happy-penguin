

function StatsCtrl($scope, $rootScope,$http, $location, $upload) {
    $scope.user = 'milan';

    $scope.param = null;
    $scope.userId = null;
    $scope.extra = null;

    $scope.lessons = [];

    $scope.$on('$locationChangeSuccess', function () {
        parseLocation($location.path());
        console.log('$locationChangeSuccess changed!', $location.path());

        if($scope.param='stat' && $scope.usr){
            loadStats();
        }


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
                $scope.lessons = data;

            }).
            error(function(data, status, headers, config) {
                // called asynchronously if an error occurs
                // or server returns response with an error status.
                $scope.loading = false;
            });
    }

}
