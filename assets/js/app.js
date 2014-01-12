var app = angular.module('voc4u', ['ngRoute', 'ngAnimate', 'ngCookies'],
    function($routeProvider, $locationProvider) {
        $routeProvider.when('/users', {
            templateUrl: 'templates/users',
            controller: UsersCtrl,
            controllerAs: 'users'
        });
        $routeProvider.when('/stats/:userId', {
            templateUrl: 'templates/stats',
            controller: StatsCtrl,
            controllerAs: 'book'
        });
        $routeProvider.when('/questions/:lang1/:lang2', {
            templateUrl: 'templates/words',
            controller: QuestionsCtrl,
            controllerAs: 'questions'
        });
        $routeProvider.when('/questions/:lang1/:lang2/:userId', {
            templateUrl: 'templates/words',
            controller: QuestionsCtrl,
            controllerAs: 'questions'
        });

        $routeProvider.when('/approveimages/:lang1/:lang2/:userId', {
            templateUrl: 'templates/words',
            controller: ApproveImageCtrl,
            controllerAs: 'questions'
        });

        $routeProvider.when('/approveimages/:lang1/:lang2', {
            templateUrl: 'templates/words',
            controller: ApproveImageCtrl,
            controllerAs: 'questions'
        });


        $routeProvider.when('/:lesson/:lang1/:lang2', {
            templateUrl: 'templates/words',
            controller: WordWebCtrl,
            controllerAs: 'wordwc'
        });





        // configure html5 to get links working on jsfiddle
        //$locationProvider.html5Mode(true);
    });

function MainCtrl($scope, $route, $routeParams, $location, $cookieStore, lastVisitService) {
    $scope.lang1 = '';
    $scope.lang2 = '';

    $scope.loading = false;

    $scope.languages =['cs', 'de','en', 'es','fr','it','id','nl','no','pl','pt','ru','sr','zh']


    $scope.lessons =[ 1001, 1002, 1003,1004, 1005, 2001, 2002, 2003, 2004, 2005, 2006, 2007, 2008, 3001, 3002, 3003, 3004, 3005, 3007, 3008, 4001, 4002, 4003, 4004, 4005, 4006, 4007, 4008, 4009, 4010];


    this.$route = $route;
    this.$location = $location;
    this.$routeParams = $routeParams;





    var cookieLessonFields =  $cookieStore.get('lessonFields');
    if(cookieLessonFields) {
       $scope.lessonFields = cookieLessonFields;
    } else {
        // must be set for help
        // when page load is first what you can see
        $scope.lessonFields = ['lesson', 'lang 1', 'lang 2'];
    }


    function haveAllLessonFields(){
         return $scope.lessonFields[0] && $scope.lessonFields[0] != 'lesson'
             && $scope.lessonFields[1] && $scope.lessonFields[1] != 'lang 1'
             && $scope.lessonFields[2] && $scope.lessonFields[2] != 'lang 2';
    }

    if(haveAllLessonFields()){
        console.log('MainCtrl', $routeParams);
        moveToLesson();
    }

    function moveToLesson(){
        $location.path('/' + $scope.lessonFields.join('/'));
        $('.content').fadeOut();
        $('.content').removeClass('hide');
        $('.content').fadeIn('slow');
    }

    $scope.langChange = function(idx, value){
        var lesson = $scope.lessonFields;

        lesson[idx] = value;

        $scope.lessonFields = lesson;

        $cookieStore.put('lessonFields', $scope.lessonFields);


        if(haveAllLessonFields()){
            moveToLesson();
        }
        //alert(idx + value);
    }


    $scope.questionsCount = 0;
    $scope.questionsWhereIAMCount = 0;


    function refreshLastVisit(qc, qwiac){
        $scope.questionsCount = qc;
        $scope.questionsWhereIAMCount = qwiac;
    }

    lastVisitService.getLastVisit(lastVisitService.QUESTION_ALL, refreshLastVisit);
    lastVisitService.getLastVisit(lastVisitService.QUESTION_WHERE_I_AM, refreshLastVisit);
}

function BookCntl($routeParams) {
    console.log('BookCntl');
    this.name = "BookCntl";
    this.params = $routeParams;
}

function ChapterCntl($routeParams) {
    console.log('ChapterCntl');
    this.name = "ChapterCntl";
    this.params = $routeParams;
}