"use strict";
var SHOW_EXPERIENCE_POPUP = 'show-experience-popup';
var SHOW_TRAIN_POPUP = 'show-train-popup';
var app = angular.module('pinguin', ['ngRoute', 'milan.levels.links.factory','penguin.LocalStorageService','milan.place.factory','milan.penguin.factory','milan.world.factory','milan.vocabulary.factory','pascalprecht.translate','ngDraggable'],
    function($routeProvider, $locationProvider, $translateProvider) {
        $routeProvider.when('/intro', {
            templateUrl: '/templates/penguin/intro',
            controller: IntroCtrl
        });

        /*$routeProvider.when('/world', {
            templateUrl: '/templates/levels/world',
            controller: WorldCtrl
        });*/

        $routeProvider.when('/wordstest/', {
            templateUrl: '/templates/penguin/wordstest',
            controller: WordsTestCtrl
        });



        $routeProvider.when('/gameover', {
            templateUrl: '/templates/penguin/gameover',
            controller: GameOverCtrl
        });

        $routeProvider.when('/train', {
            templateUrl: '/templates/penguin/train',
            controller: TrainCtrl
        });

        $routeProvider.when('/halloffame', {
            templateUrl: '/templates/penguin/halloffame',
            controller: HallOfFameCtrl
        });

        $routeProvider.when('/map', {
            controller: EmptyCtrl,
            template: '<div></div>'
        });
        $routeProvider.when('/place', {
            templateUrl: '/templates/penguin/place',
            controller: PlaceCtrl
        });

        $routeProvider.when('/sentences', {
            templateUrl: '/templates/penguin/sentences',
            controller: SentencesCtrl
        });



        $routeProvider.when('/info', {
            templateUrl: '/templates/penguin/info',
            controller: InfoCtrl
        });

        $routeProvider.when('/404', {
            templateUrl: '/templates/penguin/404'
        });

        $routeProvider.otherwise( {
            redirectTo: '/map'
        });


        $translateProvider.useStaticFilesLoader({
            prefix: 'admin/translates/get/',
            suffix: '/en/?group=0'
        });


        $translateProvider.preferredLanguage('en');
        // configure html5 to get links working on jsfiddle
        //$locationProvider.html5Mode(true);
    });



function EmptyCtrl($scope, $timeout, $location, worldFactory){


    // MAP CTRL is always call
    // so best aproach to test if game have setup game is here
    // if is in PinguinCtrl it works one time
    // but after someone pres back button
    // you get to map...
    var mygame = worldFactory.game();
    //mygame = null;
    if(mygame && mygame.native){

    } else {
        $location.path('/intro');
    }
}

/*function PinguinCtrl($scope, $location, $http, $routeParams,localStorageService,worldFactory,penguinFactory,$translate,$timeout) {

} */

function IntroCtrl($scope, $location, $routeParams,penguinFactory,worldFactory, $translate, $timeout) {
    $('#main-view1').css({'background':'none', 'border-width':0})

    var PAGEMAX = 1;

    $scope.pageMax = PAGEMAX;
    var stage= 0;// parseInt($routeParams.page);
    //if(isNaN(stage) || stage < 1 || stage > PAGEMAX){
    //    stage = 0;

    //}
    showStage(stage);

    $scope.welcomes = [
        {text: 'Vítej', flag:'cz', info: 'Cestuj, poznavej a nauc se par slovicek'},
        {text: 'Welcome', flag:'en', info: 'Travel, explore and learn couple words'},
        {text: 'Bienvenida', flag:'es', info: 'Choice language which you are speak native'},
        {text: 'Willkomen', flag:'de', info: 'Choice language which you are speak native'},
        {text: 'Accueillir', flag:'fr', info: 'Choice language which you are speak native'},
    ]

    $scope.welcomes.forEach(function(w,index){
        $('#welcome-info'+index).fadeOut();
    })

    $scope.welcomeOver = function(index, show){
        if(show){
            $('#welcome-info'+index).fadeIn('fast');
        } else {
            $('#welcome-info'+index).fadeOut('slow');
        }

    }

    function showStage(stage){
        console.log(stage);
        $scope.page = stage;
        $scope.pageNext = $scope.page + 1;
        $scope.pagePrev = $scope.page - 1;


        $('.intro_item').hide();
        if(stage>1 && stage<7){
            var intro_place = '#intro_place_info_' + stage;
            $(intro_place).fadeIn(500);
            move(intro_place)
                //.set('width',360).set('height',270)
                .scale(10)
//                .rotate(1080)
                .duration(1200)
                 .end();
        } else if(stage==7){
            var intro_place = '#lang_table';
            $(intro_place).fadeIn(500);
        }
    }

    $scope.showStageNext = function(){
        if($scope.pageNext < PAGEMAX){
            showStage($scope.pageNext);
        }


    }

    $scope.showStagePrev = function(){
        showStage($scope.pagePrev);

    }

    /*$scope.changeLang = function(lang){
        if($translate.use() != lang){
            $translate.use(lang).then(function(data){
                var translation = $translate.instant('native_lang_changed', {lang:lang});

                alertify.success(translation);
            });
        }

        $timeout(function(){
            var translation = $translate.instant('do-you-want-change-native-lang', {lang:lang});
            var translationYes = $translate.instant('button-yes', {lang:lang});
            var translationNo = $translate.instant('button-no', {lang:lang});
            alertify.set({labels:{ok:translationYes,cancel:translationNo}});
            alertify.confirm(translation, function(e){
                if(e){
                    $timeout(function(){showStage(0)},0);
                }
            });
        }, 2750);


        showStage(1);
        $scope.currentLang = lang;
        track("lang", lang);
    }*/
/*

*/


    if( $scope.pageNext > PAGEMAX) {
        $scope.pageNext = false;
    }
    if( $scope.pagePrev < 1) {
        $scope.pagePrev = false;
    }


    $scope.startGame = function(lang){
        var native = $translate.use();

        if(lang == native){
            alertify.alert($translate.instant('not_same_language', {lang: lang}));
            return;
        }

        alertify.error('jorney:' + lang + ' native:' + native);
        worldFactory.setup(lang,  native);
        worldFactory.createNewGame();
        $location.path('/place/1');
        track("Start game", {jorney:lang, native: $translate.use()});
    }

    var mixdata = {
        page : $scope.page,
        native: $translate.use()
    }


    track("intro", mixdata);

}
//$scope, $location, $http, $routeParams,localStorageService,worldFactory,penguinFactory,$translate,$timeout
function PenguinCtrl($scope, $rootScope, $location, $http, localStorageService, worldFactory, $translate, vocabularyFactory,penguinFactory) {
    var self = this;
    var element = $('#world-main');
    var map = null;
    var places;




    $scope.mapLoading = true;
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

// http://stackoverflow.com/questions/19787338/how-do-i-get-the-angularjs-routeprovider-to-perform-an-action-before-the-route-c
    $scope.$on('$routeChangeStart',function(angularEvent,next,current) {
        var coverBackground = $('#cover-background');
        var cover = $('#cover');
        var mainView = $('#main-view1')
        // stop show map
        if(!next || next.$$route.originalPath == '/map'){
            mainView.hide();
            coverBackground.stop();
            cover.slideUp('fast');
            return;
        }

        mainView.show();
        coverBackground.css({opacity:0});
        // don't show background at intro


        cover.slideDown('slow', function(){
            if(next && next.$$route.originalPath.indexOf('/intro') == -1){
                coverBackground.animate({opacity:1}, 5000);
            }
        });



    });

    $scope.addCoins = function(coins){

        if(coins < 0 && $scope.game.coins < Math.abs(coins)){
            var text = $translate.instant('not-enought-coins');
            alertify.alert(text);
            return false;
        }

        $scope.game.coins += coins;
        worldFactory.store();
        return true;
    }

    $scope.testCount =

    $scope.getTestsCounts = function(name){
        return $scope.game.testsCounts[name] || -1;
    }

    $scope.addTestsCounts = function(name, count){
        if(count < 0 && $scope.game.testsCounts[name] < Math.abs(count)){
            return;
        }

        $scope.game.testsCounts[name] += count;
        worldFactory.store();
    }



    $scope.changeLang = function(lang){
        //if($translate.use() != lang){
        $translate.use(lang).then(function(data){
            var translation = $translate.instant('native_lang_changed', {lang:lang});
            alertify.success(translation);

            worldFactory.setup(null, lang);
            worldFactory.createNewGame();
            worldFactory.store();
            worldFactory.update($scope);
            //initTravelLang(native);

            $location.path('/map');
        });
        //}

    }

    // fake place
    $scope.place = {name:'Zlin',preview:'/assets/img/orig/place/1401694785767-184379-bhmmug.jpg'}

    var mygame = worldFactory.game();

    if(mygame && mygame.native && mygame.native != 'fake'){
        var native = mygame.native;
        $translate.use(native);
        //$location.path('/map');
        $scope.currentLang = native;

        //initTravelLang(native);
    } else {
        worldFactory.setup('fake','fake');
        worldFactory.createNewGame();
        $location.path('/intro');

    }
    // have to be here othervise if is going to intro
    // the update will be not call at all and some properties
    // will miss in $scope like $scope.testsCounts
    worldFactory.update($scope);

/*
    $scope.$watch(function () { return worldFactory.getCurrentPlace(); },
        function (successPlace) {
            if(successPlace){
                $scope.place = successPlace;
                $scope.wordsLoading = false;
                //$scope.testCount = worldFactory.getCountOfLeftToPlaceHistory(successPlace, 'voc-test');
                $scope.sentenceCount = worldFactory.getCountOfLeftToPlaceHistory(successPlace, 'sentence-test');
                $('#place-controll-img').attr({'src':'/assets/img/orig/'+successPlace.preview});
                $('#cover-background').css({'background-image':'url(/assets/img/orig/'+successPlace.preview+')'});

                $scope.$watch(function () { return worldFactory.getCountOfLeftToPlaceHistory(successPlace,'voc-test'); },
                    function (coins) {
                        $scope.testCount = coins;
                    }
                );

                $scope.$watch(function () { return worldFactory.getCountOfLeftToPlaceHistory(successPlace,'sentences'); },
                    function (coins) {
                        $scope.sentencesCount = coins;
                    }
                );

            }
        }
    );
*/

    /*$scope.$watch(function () { return worldFactory.getCoins(); },
        function (coins) {
            $scope.coins = coins;
        }
    );*/


    $scope.moveToPlace = function(place){
        if(worldFactory.game().coins < place.coins){
            $('#game_resources_golds').css({color:'red'});
            alertify.error($translate.instant('not_enought', {have:worldFactory.game().coins, need: place.coins}));
            track("Place-wanted", {placeId: place.id});
        } else {

            $scope.$apply(function(){




                worldFactory.setPlace(place);

                showPenguin();
                worldFactory.setupPlacesDistancesAndExp();
                worldFactory.update($scope);
                $location.path('/info');


                //testEndGame();
                //element.hide();

                $scope.place = place;
                $scope.wordsLoading = false;
                //$scope.testCount = worldFactory.getCountOfLeftToPlaceHistory(successPlace, 'voc-test');
                $scope.sentenceCount = worldFactory.getCountOfLeftToPlaceHistory(place, 'sentence-test');
                $('#place-controll-img').attr({'src':'/assets/img/orig/'+place.preview});
                $('#cover-background').css({'background-image':'url(/assets/img/orig/'+place.preview+')'});

            })


            track("Place", {placeId: place.id});
        }
    }



    $scope.voc4ulink = function(){
        track('voc4u-link');
    }

    $scope.like = function(){
        facebook($translate, 'fb_share_base');
    }





    //worldFactory.update($scope);


    // commented when map was changed to full map
    /* $('#score-progress-bar')
        .attr('aria-valuemin', $scope.levelInfo.baseLevelExp)
        .attr('aria-valuemax', $scope.levelInfo.nextLevelExp)
        .attr('data-transitiongoal', $scope.levelInfo.levelExp); */

    // // commented when map was changed to full map
    //$('.progress .progress-bar').progressbar({use_percentage: false,display_text: 'center'});

    // commented when map was changed to full map
    //showGoldPopup();
    //showExperiencePopup();
    //showTrainPopup();




    self.generateInfo = function(place){
        var place_popover = $('#place_popover');
        place_popover.find('#place_popover_posx').text(place.posx);
        place_popover.find('#place_popover_posy').text(place.posy);
        place_popover.find('#place_popover_distance').text(place.superDistance);
        place_popover.find('#place_popover_fly').text(place.fly);
        place_popover.find('#place_popover_swim').text(place.swim);
        place_popover.find('#place_popover_walk').text(place.walk);
        place_popover.find('#place_popover_image').attr('src','/assets/img/orig/' + place.preview);
        return place_popover.html();
    }

    self.generateTitle = function(place){
        var title = '<span class="popover-title-with-resources">' + place.name + '</span>'

            + '<span class="popover-title-resources-info-left gold_resource">'
            //+ '<span class="popover-title-resources-info">' + place.walk + 'x</span>'
            //+ '<img src="/assets/img/penguin/ic_walk.png" class="resource_icon"/>'

            //+ '<span class="popover-title-resources-info">' + place.swim + 'x</span>'
            //+ '<img src="/assets/img/penguin/ic_swim.png" class="resource_icon"/>'

            + '<span class="popover-title-resources-info">' + place.coins + '</span>'
            + '<img src="/assets/img/penguin/ic_golds.png" class="resource_icon"/></span>'
            + '</span>';

        return title;
    }

    /**
     * hide all popovers in city
     * @param places
     * @param except - don't hide popover with this ID
     */
    function hideAllPlacePopovers(places, except){
        places.forEach(function(place){

            var placeid = 'placeid_'+place.id;
            if(placeid != except){
                var item = $('#'+placeid);

                if(item.length){
                    item.popover('hide');
                }
            }
        });
        $('#game_resources').popover('hide');

    }

    function updatePlaces(places){

            places.forEach(function(place){

                var placeid = 'placeid_'+place.id;
                var item = $('#'+placeid);

                if(!item.length){

                    var item = $('<div id="'+placeid+'" data-toggle="tooltip" data-placement="right" >' + '</div>').addClass('place');

                    if(place.size){
                        if(place.size > 5){
                            item.addClass('placesize5');
                        } else {
                            item.addClass('placesize' + place.size);
                        }

                    } else {
                        item.addClass('placesize0');
                    }



                    item.appendTo(element);
                    item.click(function(){

                        showPopupOfPlace(places, place);
                    });




                    item.popover({trigger:'manual',html:true,title:function(){ return self.generateTitle(place)},content:function(){
                        return self.generateInfo(place);
                    },template:'<div class="popover" role="tooltip"><div class="arrow"></div><div class="popover-title"></div><div class="popover-content"></div></div>'});



                }

                var pos = map.latLngToPoint(place.posx, place.posy);
                item.css({top: pos.y-4, left: pos.x-4});


//                var marker = {latLng: [pl.posx, pl.posy], name: pl.name, style: {r: 8, fill: 'yellow'}};
//                markers.push(marker);
                //map.addMarker(''+pl.id, marker);
                //$('#world-main').append('ahoj').addClass('place');

            });


    }

    function showPopupOfPlace(places, place){
        var placeid = 'placeid_' + place.id;

        $(document).off("click").on("click", "#btn_place_visit", function() {
            moveToPlace(place);
            hideAllPlacePopovers(places);
        });

        hideAllPlacePopovers(places, placeid);
        $('#' +placeid).popover('show');
    }

    function setupMap(){
        $scope.mapLoading = true;
        worldFactory.loadPlaces(function(iplaces,placesIds){
            places = iplaces;
            updatePlaces(places);
            worldFactory.setupPlacesDistancesAndExp();
            testEndGame();
            showPenguin();
            preloadPreviews(places);
            $scope.mapLoading = false;
        });
    }


    function preloadPreviews(places){
        places.forEach(function(place){
            if(place.preview){
                var img=new Image();
                img.src='/assets/img/orig/' + place.preview;
            }

        });
    }

    function showPenguin(){
        var currPlace = worldFactory.getCurrentPlace();

        // showPenguin is call from onViewportChange
        // but placesInWorldIds is still null
        if(!currPlace){
            return;
        }

        var currentMarkers = {latLng: [currPlace.posx, currPlace.posy]};

        var v = map.getMarkerPosition(currentMarkers);

        var item = $('#penguin2');

        if(!item.length){
            item  = $('<img id="penguin2" src="assets/img/penguin/penguin_3.png"/>');
            item.appendTo(jQuery('#world-main'));
        }

        item.css({top: v.y-30, left: v.x-18});
        item.on('click', function(){




        })



    }


    function moveToPlace(place){
//        placeFactory.setupPlace(placeId, function(successPlace){
//            $scope.place = successPlace;
//        });

        $scope.moveToPlace(place);
    }


    function testEndGame(){
        if(!worldFactory.testEndGame()){
            //alertify.alert('Game over!');
            $location.path('/gameover');

        }
    }

    function onViewportChange(e1,imap){
        if(!map){
            map = imap;
            setupMap();
        } else if(places) {
            updatePlaces(places);
            showPenguin();

            // is here because the popover is apear in click on city
            // but if the map is zooom or moved the popover still pointing
            // in wrong position, to place where the place/city was before
            hideAllPlacePopovers(places);
        }
    }

    $scope.ahoj = function(){

    }

    function showGoldPopup(){
        // timeout because without that the popup is initialize before is DOM ready
        // TODO: have to be a better way
        window.setTimeout(function(){
            var element = $('#game_resources');
            var title = $translate.instant('golds');
            var content = $translate.instant('golds-potup-content');
            element.popover({title:title,content:content, trigger:'click'});

            // don't do rest if are already visited some places
            // the user already know how the game works
            if(!worldFactory.game() || !worldFactory.game().visited || worldFactory.game().visited.length > 0){
                return;
            }

            // >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
            //    only for user who visit page first time
            //element.popover('show');


            element.on('show.bs.popover', function () {
                //hideAllPlacePopovers(places);
            })

            // jQuery too much recursion
            // when is call showPopupOfPlace is also hideAllPlacePopovers what also call
            // hidden.bs.popover -> so for disable recursion disable that
            var show = false;
            //element.on('hidden.bs.popover', function () {
                if(!show){
                    show = true;
                    places.some(function(place){
                        // find prague and show pottup
                        if(place.id == 2){
                            showPopupOfPlace(places, place);
                            return true;
                        }

                    });
                }

            //});

        },5000);
    }

    function showExperiencePopup(){
        if($scope.levelInfo.levelExp > 0){
            showPopup('experience', $translate, SHOW_EXPERIENCE_POPUP, localStorageService, $translate);
        }

    }

    function showTrainPopup(){
        // NOTE: it will not work after refresh browser
        // but when the user will come from visit city should works
        if(vocabularyFactory.isPossibleTrain()){
            showPopup('train', $translate, SHOW_TRAIN_POPUP, localStorageService);
        }
    }




    jQuery(function(){

        element.vectorMap({
            onRegionClick:function(event, code){
                console.log('region-over', event, code);
            },onMarkerClick:function(event, marker, over){
                console.log('region-over', event, marker, over);
                var item  = $('<img src="assets/img/pinguin/penguin_3.png"/>');
                item.appendTo(event.target);
                //event.target.add('<div>ahoj</div>');

            },onMarkerLabelShow: function(event, label, index){
                var h = label.html();
                label.html('aoooj');

                //alert(h);

                //e1.preventDefault();
//                e2[0].text('ahoj');
//                e2.text('ahoj');
                var place = worldFactory.getCurrentPlace();
//                var item  = $('<span />');
//                item.appendTo(element);
//
                var popovers= $('.jvectormap-marker');
                popovers.forEach(function(p){
                    p.popover({trigger:'hover',html:true,title:place.name,content:function(){
                        return self.generateInfo(place);
                    }});
                });

                //event.target.css({top: 20, left: 20});
            },onViewportChange : onViewportChange,
            backgroundColor: '#207cca',
            borderColor: '#000',
            borderOpacity: 0.1,
            borderWidth: 3,
            color: '#0b4e00',
            markersSelectable: true,
            markersSelectableOne: true,
            normalizeFunction: 'linear',
            scaleColors: ['#207cca', '#005ace'],
            focusOn: {
                x: 0.5,
                y: -0.39,
                scale: 1
            },map: 'world_mill_en',series: {
                regions: [{
                    values: {
                        "CZ":'#4aff4a',
                        "NZ":'#4aff4a',
                        "GB":'#4aff4a',
                        "FR":'#4aff4a',
                        "ES":'#fdff68',
                        "TH":'#fdff68',
                        "US":'#4aff4a',
                        "TR":'#fdff68',
                        "IN":'#fdff68',
                        "BR":'#4aff4a',
                        "AU":'#FF7c7c'
                    }
                }]
            }});
    });


}

function HallOfFameCtrl($scope, worldFactory, $http, localStorageService,$location,$translate){

    var SCORE_NAME_LOCALSTORAGE = 'last-score-name';
    var SCORE_LEVEL_EXP_LOCALSTORAGE = 'last-score-value';

    $scope.game = worldFactory.game();
    var stats = worldFactory.getStats();
    worldFactory.update($scope);


    $scope.name = localStorageService.get(SCORE_NAME_LOCALSTORAGE) || '';
    $scope.last_levelExp = localStorageService.get(SCORE_LEVEL_EXP_LOCALSTORAGE) || 0;


    // the user visited page with score, don't show more
    localStorageService.set(SHOW_EXPERIENCE_POPUP, 1);

    var levelExp = $scope.levelInfo.levelExp;

    // debug
    //levelExp = 2000;
    var mixdata = {
        correctTotal:stats.correct,
        wrongTotal:stats.wrong,
        wordsTotal:$scope.wordsTotal,
        TOTAL:$scope.TOTAL,
        travelersTotal: $scope.travelersTotal,
        citiesTotal : $scope.citiesTotal,
        'placesTotal': stats.placesTotal,
        'placesUniq' : $scope.game.visited.length,
        placeId : $scope.game.placeId,
        lang: $scope.game.lang,
        learn: $scope.game.learn,
        'correctInRowScore[0]' : stats.correctInRowScore[0],
        'correctInRowScore[1]' : stats.correctInRowScore[1],
        'correctInRowScore[2]' : stats.correctInRowScore[2],
        'correctInRowScore[3]' : stats.correctInRowScore[3],
        'correctInRowScore[4]' : stats.correctInRowScore[4],
        'fastAnswerScore[0]' : stats.fastAnswerScore[0],
        'fastAnswerScore[1]' : stats.fastAnswerScore[1],
        'fastAnswerScore[2]' : stats.fastAnswerScore[2],
        'walkTotal' : stats.walkTotal,
        'swimTotal' : stats.swimTotal,
        'flyTotal' : stats.flyTotal,
        'expTotal' : stats.expTotal,
        'wordTestTime' : stats.wordTestTime,
        'levelExp' : levelExp
    }

    track("halloffame", mixdata);

    var url = 'scores/0/' + $scope.game.learn + '/0?api=penguin&score=' + levelExp;

    requestGET($http, url, function(response, status){
        // must be last level exp diferent to score
        // othervise user can update his score every time
        // when he visit page with scores (and remove the oldier record)
        if($scope.last_levelExp != levelExp){
            $scope.position = response.position;
        }



        $scope.scores = [];
        var newScoreRow = {
            score: levelExp,
            name : null,
            showinput : true
        };
        response.scores.forEach(function(score, idx){
            // if is position of score show edit box

            if(idx==$scope.position){
                $scope.scores.push(newScoreRow);
            }

            $scope.scores.push(score);
        });

        // add to end of sets
        if($scope.position == $scope.scores.length){
            $scope.scores.push(newScoreRow);
        }

        // scroll down just if is something on the bottom
        if($scope.position){
            window.setTimeout(function(){
                var m = $('#table-with-scores');
                var top1 = m.find('tr').eq($scope.position).position().top;
                m.scrollTop(top1);
            },600);
        }


        //$('#input-for-name-in-table-scores').top;
        console.log(response, status);
    });

    $scope.backToMap = function(){
        $location.path('/world');
    }

    $scope.facebook = function(){
        facebook($translate, 'fb_share_halloffame', {num: stats.placesTotal, score:$scope.levelInfo.levelExp});
    }

    $scope.save = function(name){

        // it is going from parameter name
        // because $scope.name wasn't refesh from input

        if(!name || name == ''){
            alertify.error($translate.instant('score-name-empty'));
            return;
        }

        var url = 'scoreadd/0/' + $scope.game.learn + '/0?api=penguin';
        localStorageService.set(SCORE_NAME_LOCALSTORAGE, name);
        localStorageService.set(SCORE_LEVEL_EXP_LOCALSTORAGE, levelExp);
        mixdata.scoreName = name;

        track("halloffame_signin", mixdata);

        requestPOST($http, url, {score:{score:levelExp,name:name}}, function(response, status){
            $scope.scores = response.scores;
            $scope.position = null;
        });
    }


}

function TrainCtrl($scope, worldFactory, $location, $translate, vocabularyFactory, localStorageService){


    var trainWords = vocabularyFactory.getTrainWords();

    // isPossibleTrain have to be call after getTrainWords()
    // where is call restoreFactory from storage
    // otherwise after refresh browser the isPossibleTrain could return false!
    if(!vocabularyFactory.isPossibleTrain()){
        // is not enought words for practising
        // show alert message
        $location.path('/map');
        var noEnoughtWords = $translate.instant('train-no-enought-words');
        alertify.alert(noEnoughtWords);
    } else {
        // the user visited page with score, don't show more
        localStorageService.set(SHOW_TRAIN_POPUP, 1);
        showPopup('train-test-word', $translate);
    }


    $scope.maxInList = trainWords.length;
    $scope.current = 1;
    $scope.testWord = trainWords.splice(0, 1)[0];
    $scope.lastList = [];


    track("train", {maxInList: $scope.maxInList});

    $scope.nextWord = function(know){
        track("train-next", {
            know:know
            /*maxInList: $scope.maxInList,
            current: $scope.current,
            word_id: $scope.testWord.id*/
        });

        hidePopup('train-test-word');

        // have to be before test word will be changed
        // othervise the user desision will be in next comming word
        vocabularyFactory.trainNext($scope.testWord, know);

        // changed test word
        $scope.lastList.unshift($scope.testWord);
        $scope.testWord = trainWords.splice(0, 1)[0];
        $scope.current += 1;

        if($scope.maxInList == $scope.current){
            track("train-all", {
                maxInList: $scope.maxInList
            });
        }
    }

    $scope.backToMap = function(){
        $location.path('/map');
        worldFactory.addScore({totalCoins:10});
    }

}

function GameOverCtrl($scope, worldFactory, $location, $translate){
    var stats = worldFactory.getStats();
    $scope.game = worldFactory.game();
    $scope.view = 3;

    $scope.stats = stats;
    $scope.citiesTotal = stats.placesTotal * 1000;

    $scope.wordsTotal = stats.correct * 1000;

    $scope.travelersTotal = (stats.walkTotal + stats.swimTotal + stats.flyTotal) * 1000;

    $scope.TOTAL = $scope.citiesTotal   + $scope.wordsTotal + $scope.travelersTotal;


    $scope.changeView = function(view){
        $scope.view = view;
    }

    $scope.startNewGame = function(){
        $location.path('/intro');
    }

    $scope.facebook = function(){
        facebook($translate, 'fb_share_finish', {num: stats.placesTotal, score:$scope.TOTAL});
    }

    var mixdata = {
        correctTotal:stats.correct,
        wrongTotal:stats.wrong,
        wordsTotal:$scope.wordsTotal,
        TOTAL:$scope.TOTAL,
        travelersTotal: $scope.travelersTotal,
        citiesTotal : $scope.citiesTotal,
        'placesTotal': stats.placesTotal,
        'placesUniq' : $scope.game.visited.length,
        placeId : $scope.game.placeId,
        lang: $scope.game.lang,
        learn: $scope.game.learn,
        'correctInRowScore[0]' : stats.correctInRowScore[0],
        'correctInRowScore[1]' : stats.correctInRowScore[1],
        'correctInRowScore[2]' : stats.correctInRowScore[2],
        'correctInRowScore[3]' : stats.correctInRowScore[3],
        'correctInRowScore[4]' : stats.correctInRowScore[4],
        'fastAnswerScore[0]' : stats.fastAnswerScore[0],
        'fastAnswerScore[1]' : stats.fastAnswerScore[1],
        'fastAnswerScore[2]' : stats.fastAnswerScore[2],
        'walkTotal' : stats.walkTotal,
        'swimTotal' : stats.swimTotal,
        'flyTotal' : stats.flyTotal,
        'expTotal' : stats.expTotal,
        'wordTestTime' : stats.wordTestTime
    }

    track("ganeover", mixdata);



}


function facebook($translate, descCode, descData, callbackSuccess){
    track(descCode);
    descData = descData || {};

    var desc = $translate.instant(descCode, descData);
    console.log('facebook:'+descCode, desc, descData);
    FB.ui(
        {
            method: 'feed',
            name: $translate.instant('fb_name'),
            caption: $translate.instant('fb_caption'),
            description: desc,
            link: 'www.happy-penguin.eu',
            picture: 'www.happy-penguin.eu/assets/img/penguin/penguin_3.png'
        },
        function(response) {
            if (response && response.post_id) {
                track(descCode + '_published');
                if(callbackSuccess){
                    callbackSuccess();
                }

            } else {
                track(descCode + '_notp');
            }
        }
    );
}

function showPopup(key, translate, storageKey, storageService){

    // look if user already visit experience page
    var hide = false;
    if(storageKey && storageService){
        hide =  storageService.get(storageKey);
    }


    if(!hide){
        var element = $('#'+key+'_link');
        var title = translate.instant(key + '-title');
        var content = translate.instant(key + '-content');
        element.popover({delay: { show: 3500, hide: 100 }, trigger:'manual', title:title,content:content});
        element.popover('show');
    }
}

function hidePopup(key){
    var element = $('#'+key+'_link');
    element.popover('hide');
}