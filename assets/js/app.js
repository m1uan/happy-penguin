var app = angular.module('voc4u', ['ngRoute', 'ngAnimate', 'ngCookies'],
    function($routeProvider, $locationProvider) {
        $routeProvider.when('/Book/:bookId', {
            templateUrl: '/assets/book.html',
            controller: BookCntl,
            controllerAs: 'book'
        });
        $routeProvider.when('/Book/:bookId/ch/:chapterId', {
            templateUrl: '/assets/chapter.html',
            controller: ChapterCntl,
            controllerAs: 'chapter'
        });

        $routeProvider.when('/:lesson/:lang1/:lang2', {
            templateUrl: 'templates/words',
            controller: WordWebCtrl,
            controllerAs: 'wordwc'
        });

        // configure html5 to get links working on jsfiddle
        //$locationProvider.html5Mode(true);
    }).controller('Ctrl', function($scope) {
        $scope.customer = {
            name: 'Naomi',
            address: '1600 Amphitheatre'
        };
    });

function MainCtrl($scope, $route, $routeParams, $location, $cookieStore) {
    $scope.lang1 = '';
    $scope.lang2 = '';

    $scope.loading = false;

    $scope.languages =['cs', 'de','en', 'es','fr','it','pt','ru','sr','zh']


    $scope.lessons =[ 1001, 1002, 1003,1004, 1005, 2001, 2002, 2003, 2004, 2005, 2006, 2007, 2008, 3001, 3002, 3003, 3004, 3005, 3007, 3008, 4001, 4002, 4003, 4004, 4005, 4006, 4007, 4008, 4009, 4010,101, 102, 103, 104, 105, 106, 107, 108, 109, 110 ];


    this.$route = $route;
    this.$location = $location;
    this.$routeParams = $routeParams;


    function showDialogById(dialogId, yesevent) {
        var modalDialog = $(dialogId);

        modalDialog.find('#yesbutton').click(function(event) {
            yesevent(event);
            modalDialog.modal('hide');
        });

        modalDialog.modal('show');

        return modalDialog;
    }

    function showConfirmDialog(title, message, yesevent){
        var modalDialog = showDialogById('#modal-from-dom', yesevent);

        modalDialog.find('#warning_dialog_title').text(title);
        modalDialog.find('#warning_dialog_message').text(message);
    }


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
        moveToLesson();
    }

    function moveToLesson(){
        $location.path('/' + $scope.lessonFields.join('/'));
        $('#content').fadeOut();
        $('#content').removeClass('hide');
        $('#content').fadeIn('slow');
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