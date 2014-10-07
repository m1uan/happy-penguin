/**
 * Created by miuan on 7/10/14.
 */
(function() {
    'use strict';

}).call(this);



function InfosCtrl($scope, $routeParams, $http) {

    $scope.newinfo = {type:1};

    updateInfos();

    requestGET($http, 'infotypes/?fields=pit,name', function(response, status){
        console.log(response);
        $scope.types = response;

    });



    function updateInfos(){
        requestGET($http, 'infos/?fields=pi,name,type&timestamp=' + new Date().getTime(), function(response, status){
            $scope.infos = response;

        })
    };


    $scope.add = function(){
        if(!$scope.newinfo.name || !$scope.newinfo.type) {
            alertify.error('name or type is not selected');
            return ;
        }
        requestPOST($http, 'infocreate/', $scope.newinfo, function(response, status){
            $scope.newinfo = {};
            updateInfos();
        });
    }

}


function InfoCtrl($scope, $routeParams, $http, $timeout, $window, linksFactory, searchFactory) {
    $scope.info = {pi : $routeParams.id};
    $scope.current = 'en';
    $scope.possible = [{lid: 1, desc:'ahoj'},
        {lid: 2, desc: 'hello'}];
    $scope.selectedWord = {possible: $scope.possible};

    var _searchedWords = {};
    var _linkedWords = {};


    var words = {};
    var helpIndex = 0;

    requestGET($http, '/admin/translates/langs/?fields=name,translate,lang', function(response, status){
        $scope.langs=response.langs;

        requestGET($http, 'infotypes/?fields=pit,name', function(response, status){
            console.log(response);
            $scope.types = response;
            updateInfo();
        });
    });



    function updateInfo(){
        requestGET($http, 'info/?pi='+$scope.info.pi+'&timestamp=' + new Date().getTime(), function(response, status){
            console.log(response);
            $scope.info = response;

            $scope.langs.forEach(function(lang){
                if(!$scope.info.translates[lang.lang]){
                    $scope.info.translates[lang.lang] = {name: '', info : ''}
                }
            })

            updateWords();

        });
    }

    function updateWords(lang, suppresTextArea){
        var lang = $scope.current;
        splitBlocks(lang);
        linksFactory.get(lang, words[lang], function(){
            showWordsInLineOfWords(lang, suppresTextArea);
        });

    }

    function createWordAndLink(sentence, w){
        // identify link basicaly hello[1]
        var wordAndLink = w.split('[');
        var word = wordAndLink[0];
        var link = 0;

        // link is number with ] '1]'
        if(wordAndLink.length > 1){
            var linkText = wordAndLink[1].split(']')[0];
            link = parseInt(linkText);
        }

        // remove special characters
        // like simple word for search
        var simple = word.replace(/[^a-zA-Zěščřžýáíúůñ ]/g, "")


        return {
            link: link,
            type: 3,
            simple : simple,
            word : word,
            sentence : sentence,
            id : helpIndex ++
        }
    }

    function splitWords(lang, sentence){
        var aw = sentence.split(' ');
        aw.forEach(function(w){
            // sometime is word like ' '
            if(w == '' || w == '.'){
                return;
            }

            words[lang].push(createWordAndLink(sentence, w));
        })
    }

    function splitSentences(lang, block){
        // sentence first because each word
        // will contain reference to sentence
        var sentences = block.split('.')


        sentences.forEach(function(sentence){
            // supress empty sentences
            // 'ahoj. '.split('.') separe string to ['ahoj',' ']
            // and in 2nd index the splitWords method will operate with ' '
            // that will not add any words but will add word with type 1
            // thats dot and with this behavior will have two dots on end
            if(sentence.trim()){
                splitWords(lang, sentence);
                words[lang].push({type:1});
            }
        });
    }

    function splitBlocks(lang){
        // first detect blogs for determine end of block
        var blocks = $scope.info.translates[lang].info.split('\n\n');
        words[lang] = [];
        helpIndex = 0;


        blocks.forEach(function(block){
            splitSentences(lang, block);
            // determine end of block
            words[lang].push({type:0});
        })
    }


    function showWordsInLineOfWords(lang, suppressTextArea){
        // line in editor
        var editLine = ''
        // line in list of words
        var lineOfWords = $('#lineofwords');
        lineOfWords.empty();

        words[lang].forEach(function(word){
            if(word.type == 0){
                editLine += '\n\n';
                lineOfWords.append('<div class="clearfix"></div><br/><br/>');
            } else if(word.type == 1) {
                editLine += '.';
                lineOfWords.append('<div class="inner-words">.</div>');
            } else {
                //lineOfWords.append('<span> </span>');
                var qword = $('<span class="inner-words" id="inner-word-'+word.id+'"></span>');

                qword.append('<div>&nbsp;'+word.word+'</div>')

                if(word.link && word.possible && word.possible[0]){
                    qword.append('<div class="connect-words" id="connect-word-'+word.id+'">'+word.possible[0].desc+'</div>');
                } else {
                    qword.append('<div class="connect-words" id="connect-word-'+word.id+'">&nbsp;</div>');
                }

                qword.on('click', function(el){selectWord(el, word, lang)});
                qword.appendTo(lineOfWords);
                editLine += ' ' + word.word;
                if(word.link){
                    editLine += '[' + word.link + ']';
                }

            }


        });

        // if you edit text area, ng-change call showWordsInLineOfWords
        // for update line in #lineofwords
        // but if you set scope translates, you lost write focus
        if(!suppressTextArea){
            $scope.info.translates[lang].info = editLine;
        }

    }

    function wordsCheck(lang){
        var wordList = '';

        // group words
        searchFactory.search(lang, words[lang], function(){
            showWordsInLineOfWords(lang);
        });


    }

    function selectWord(el, word, lang){

        $scope.$apply(function(){

            $scope.selectedWord = word;

            $('.inner-words').removeClass('inner-words-selected');
            $('#inner-word-' + word.id).addClass('inner-words-selected');
        })

        //$('#connect-word-' + word.id).text('ahoj');
        console.log(el, word.word);
    }

    function wordMoveSelectedUp(word, poss){
        var possible = word.possible;
        possible.some(function(w){
            if(w.lid == poss.lid){
                word.possible = [poss];
                return true;
            }
        });

        possible.forEach(function(w){
            if(w.lid != poss.lid){
                word.possible.push(w);
            }
        });
    }

    $scope.selectWordPossibility = function(word, poss){
        console.log(word, poss);
        if(poss){
            word.link = poss.lid;

            // show line take first word in possible
            // to show in underline word
            // move selected word to first position
            wordMoveSelectedUp(word, poss);
        } else {
            // remove
            word.link = null;
        }


        showWordsInLineOfWords($scope.current);
    }

    $scope.checkSelectedWord = function(){
        searchFactory.search($scope.current, [$scope.selectedWord], function(){

        });
    }


    $scope.changeLang = function(lang){
        $scope.current = lang;
        updateWords();
    }

    $scope.update = function(){
        requestPOST($http, 'info/', $scope.info, function(response, status){
            updateInfo();
        });
    }

    $scope.check = function(){
        wordsCheck($scope.current);
    }

    var setTimeOutForUpdate = null;
    $scope.infoChange = function(lang){
        if(setTimeOutForUpdate) {
            return;
        }
        // dont update word every change, it is enought one time per 2s
        setTimeOutForUpdate = setTimeout(function(){
            setTimeOutForUpdate = null;
            updateWords(lang, true);
        }, 2000)

    }




}