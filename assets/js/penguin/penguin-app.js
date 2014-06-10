"use strict";

var app = angular.module('pinguin', ['ngRoute', 'penguin.LocalStorageService','milan.penguin.factory','milan.world.factory','milan.vocabulary.factory','pascalprecht.translate'],
    function($routeProvider, $locationProvider, $translateProvider) {
        $routeProvider.when('/intro/:page', {
            templateUrl: '/templates/penguin/intro',
            controller: IntroCtrl
        });

        $routeProvider.when('/world', {
            templateUrl: '/templates/levels/world',
            controller: WorldCtrl
        });

        $routeProvider.when('/wordstest/:placeid', {
            templateUrl: '/templates/penguin/wordstest',
            controller: WordsTestCtrl
        });

        $routeProvider.when('/gameover', {
            templateUrl: '/templates/penguin/gameover',
            controller: GameOverCtrl
        });
        $routeProvider.when('/404', {
            templateUrl: '/templates/penguin/404'
        });

        $routeProvider.otherwise( {
            redirectTo: '/world'
        });


        $translateProvider.useStaticFilesLoader({
            prefix: 'admin/translates/get/',
            suffix: '/en/?group=0'
        });


        $translateProvider.preferredLanguage('en');
        // configure html5 to get links working on jsfiddle
        //$locationProvider.html5Mode(true);
    });


function ExchangeDialog(){
    var exchange = $('#modal-exchange');

    // the values on inputs are put there from another controller
    // with the same jQuery technics, so the models are not actualised...
    // have to be recaived with the same technics
    var exp = exchange.find('#modal-exchange-exp');
    var walk = exchange.find('#modal-exchange_resources_walk');
    var swim = exchange.find('#modal-exchange_resources_swim');
    var fly = exchange.find('#modal-exchange_resources_fly');



    return {
        expToTravelers : function(){
            var e = parseInt(exp.val());
            if(e >= 3){
                exp.val(e - 3);
                walk.val(parseInt(walk.val())+1);
                swim.val(parseInt(swim.val())+1);
                fly.val(parseInt(fly.val())+1);
            }
        }, setup : function(e,w,s,f){
            exp.val(e);
            walk.val(w);
            swim.val(s);
            fly.val(f);
        }, show : function(onClick){
            exchange.modal('show');
            if(onClick){
                exchange.find('#modal-exchange-button').unbind().click(onClick);
            }

        },getValues : function(){
            return {exp:parseInt(exp.val()),walk:parseInt(walk.val()), swim:parseInt(swim.val()), fly:parseInt(fly.val())}
        }
    }
}
function PinguinCtrl($scope, $location, $http, $routeParams,localStorageService,worldFactory,penguinFactory,$translate) {

    $scope.currentLang = $translate.use();
    $scope.langs = [];
    penguinFactory.getLangs('en', function(langs){

        $scope.langs = langs;

    })



    //var base = {};
    var mygame = worldFactory.game();

//    if(!mygame){
//        mygame = worldFactory.createNewGame(localStorageService);
//    }


    if(mygame && mygame.native){
        var native = mygame.native;
        $translate.use(native);
        $location.path('/world');
        $scope.currentLang = native;
    } else {
        $location.path('/intro/1');
    }


    $scope.voc4ulink = function(){
        track('voc4u-link');
    }

    $scope.changeLang = function(lang){
        if($translate.use() != lang){
            $translate.use(lang).then(function(data){
                var translation = $translate.instant('native_lang_changed', {lang:lang});
                alertify.success(translation);
            });



        }
        $scope.currentLang = lang;
        track("lang", lang);
    }

    $scope.expToTravelers = function(){
        ExchangeDialog().expToTravelers();

    }


    $scope.like = function(){
        facebook($translate, 'fb_share_base');
    }



}

function IntroCtrl($scope, $location, $routeParams,penguinFactory,worldFactory, $translate) {
    var PAGEMAX = 5;

    $scope.page = parseInt($routeParams.page);
    if(isNaN($scope.page) || $scope.page < 1 || $scope.page > PAGEMAX){
        $scope.page = 1;
    }

    $scope.langs = [];
    penguinFactory.getLangs($translate.use(), function(langs){

        $scope.langs = langs;
    });



    $scope.pageNext = $scope.page + 1;
    $scope.pagePrev = $scope.page - 1;

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
        $location.path('/world');
        track("Start game", {jorney:lang, native: $translate.use()});
    }

    var mixdata = {
        page : $scope.page,
        native: $translate.use()
    }


    track("intro", mixdata);

}

function WorldCtrl($scope, $location, $http, localStorageService, worldFactory, $translate) {
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





    worldFactory.update($scope);


    $scope.showExchange = function(){


        var ed = ExchangeDialog();
        ed.setup(worldFactory.game().exp, worldFactory.game().walk, worldFactory.game().swim, worldFactory.game().fly);
        ed.show(function(){
            $scope.$apply(function(){
                var values = ed.getValues();
                var score = {
                    exp: values.exp - parseInt(worldFactory.game().exp),
                    walk : values.walk - parseInt(worldFactory.game().walk),
                    swim : values.swim - parseInt(worldFactory.game().swim),
                    fly : values.fly - parseInt(worldFactory.game().fly)
                }


                console.log('score', score, values);
                worldFactory.addScore(score);

                worldFactory.update($scope);

                //testEndGame();
                //element.hide();

            })
        });

    }

    self.generateInfo = function(place){
        var place_popover = $('#place_popover');
        place_popover.find('#place_popover_posx').text(place.posx);
        place_popover.find('#place_popover_posy').text(place.posy);
        place_popover.find('#place_popover_distance').text(place.superDistance);
        place_popover.find('#place_popover_fly').text(place.fly);
        place_popover.find('#place_popover_swim').text(place.swim);
        place_popover.find('#place_popover_walk').text(place.walk);
        return place_popover.html();
    }

    function updatePlaces(places){

            places.forEach(function(place){

                var placeid = 'placeid_'+place.id;
                var item = $('#'+placeid);

                if(!item.length){
                    var item = $('<div id="'+placeid+'" data-toggle="tooltip" data-placement="left" title="'+place.name+'">' + place.id + '</div>').addClass('place');

                    item.appendTo(element);
                    item.click(function(){
                        moveToPlace(place);
                    });

                    item.popover({trigger:'hover',html:true,title:place.name,content:function(){
                        return self.generateInfo(place);
                    }});
                }

                var pos = map.latLngToPoint(place.posx, place.posy);
                item.css({top: pos.y-14, left: pos.x-14});


//                var marker = {latLng: [pl.posx, pl.posy], name: pl.name, style: {r: 8, fill: 'yellow'}};
//                markers.push(marker);
                //map.addMarker(''+pl.id, marker);
                //$('#world-main').append('ahoj').addClass('place');

            });

    }

    function setupMap(){
        $scope.mapLoading = true;
        worldFactory.loadPlaces(function(iplaces,placesIds){
            places = iplaces;
            updatePlaces(places);
            worldFactory.setupPlacesDistancesAndExp();
            testEndGame();
            showPenguin();
            $scope.mapLoading = false;
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




    }


    function moveToPlace(place){
        $location.path('/wordstest/'+place.id);
        var what = '';
        if(worldFactory.game().fly < place.fly){
            what = $translate.instant('fly');
            $('#game_resources_fly').css({color:'red'});
        } else if(worldFactory.game().swim < place.swim){
            what = $translate.instant('swim');
            $('#game_resources_swim').css({color:'red'});
        } else if(worldFactory.game().walk < place.walk){
            $('#game_resources_walk').css({color:'red'});
        } else {
            $scope.$apply(function(){


                worldFactory.setPlace(place);

                showPenguin();
                worldFactory.setupPlacesDistancesAndExp();
                worldFactory.update($scope);

                //testEndGame();
                //element.hide();

            })
            track("Place", {placeId: place.id});
        }

        if(what){
            alertify.error($translate.instant('not_enought', {have:worldFactory.game().walk, need: place.walk, what: what}));
        }
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

        }
    }

    $scope.ahoj = function(){

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
            borderOpacity: 0.9,
            borderWidth: 30,
            color: '#f4fff0',
            markersSelectable: true,
            markersSelectableOne: true,
            focusOn: {
                x: 0.5,
                y: -0.39,
                scale: 3
            },map: 'world_mill_en',series: {
                regions: [{
                    values: {
                        "CZ":'#0b4e00',
                        "NZ":'#0b4e00'
                    }
                }]
            }});
    });


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
        $location.path('/intro/1');
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


function facebook($translate, descCode, descData){
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
            } else {
                track(descCode + '_notp');
            }
        }
    );
}