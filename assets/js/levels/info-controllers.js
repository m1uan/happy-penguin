/**
 * Created by miuan on 7/10/14.
 */
(function() {

    function BlockOperators(langs){
        'use strict';
        var self = {}

        self.words = {};
        self.usagesWords = {};
        self.langs = langs;


        self.updateWordUsages = function(){
            var actualWordCount = self.calcUsagesForWordsForAllLangs();

            // difference between actualWordCount and usagesWords
            // example is loadet text 'Hello[101] Milan[103], Hello[101]...
            // so usagesWords will looks like : {'101' : 2, '103' : 1, ...
            // if no-body will change text and update reference = usages should be {'101' : 0, '103' : 0, ...
            // thats meand no changes with usages
            // but when somebody change text and update reference like
            // 'Hello[101] Milan[103], Hi[102]...
            // usages hold look like {'101' : -1, '102' : 1, ...
            // thats mean ref 101 decrease and ref 102 increase
            for(var awcLink in actualWordCount){
                if(self.usagesWords[awcLink]){
                    actualWordCount[awcLink] -= self.usagesWords[awcLink];
                }
            }

            // if someone removed
            for(var uLink in usagesWords){
                if(!actualWordCount[uLink]){
                    actualWordCount[uLink] = -self.usagesWords[awcLink];
                }
            }

        }

        /**
         * need to be updated words for all languages
         * i mean splitBlock for all languages
         */
        self.calcUsagesForWordsForAllLangs = function(){
            var usages = {};
            self.langs.forEach(function(lang){


                self.words[lang.lang].forEach(function(w){
                    if(w.link){
                        if(usages[w.link]){
                            usages[w.link] += 1;
                        } else {
                            usages[w.link] = 1;
                        }

                    }
                })

            })

            return usages;
        }





        self.createWordAndLink = function(sentence, w){
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
            var simple = word.replace(/[^a-zA-Zěščřžýáíúůñé ]/g, "")


            return {
                link: link,
                type: 0,
                simple : simple,
                word : word,
                sentence : sentence,
                id : self.helpIndex ++
            }
        }

        self.splitWords = function(lang, sentence){
            var aw = sentence.split(' ');
            aw.forEach(function(w){
                // sometime is word like ' '
                if(w == '' || w == '.'){
                    return;
                }

                self.words[lang].push(self.createWordAndLink(sentence, w));
            })
        }

        self.splitSentences = function(lang, block){
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
                    self.splitWords(lang, sentence);
                    self.words[lang].push({type:2});
                }
            });
        }

        self.helpIndex = 0;

        self.splitBlocks = function(lang, info){
            // first detect blogs for determine end of block
            var blocks = info.split('\n\n');
            self.words[lang] = [];
            self.helpIndex = 0;


            blocks.forEach(function(block){
                self.splitSentences(lang, block);
                // determine end of block
                self.words[lang].push({type:1});
            })
        }


        return self;
    }

    this.BlockOperators = BlockOperators;


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


    var blockOperators;



    requestGET($http, '/admin/translates/langs/?fields=name,translate,lang', function(response, status){
        $scope.langs=response.langs;
        blockOperators = new BlockOperators($scope.langs);
        requestGET($http, 'infotypes/?fields=pit,name', function(response, status){
            console.log(response);
            $scope.types = response;
            loadInfoIntoInterface();
        });
    });



    function loadInfoIntoInterface(){
        requestGET($http, 'info/?pi='+$scope.info.pi+'&timestamp=' + new Date().getTime(), function(response, status){
            console.log(response);
            $scope.info = response;

            $scope.langs.forEach(function(lang){
                if(!$scope.info.translates[lang.lang]){
                    $scope.info.translates[lang.lang] = {name: '', info : ''}
                }
            })



            splitBlocksAndShowInLine();
            // after load is necesary count word usages
            // because after save(update) will count diference
            // with loaded count and updated count
            usagesWords = blockOperators.calcUsagesForWordsForAllLangs();

        });
    }

    function update(){
        requestPOST($http, 'info/', $scope.info, function(response, status){

            blockOperators.updateWordUsages();
            loadInfoIntoInterface();
        });
    }

    function splitBlocksAndShowInLine(lang, suppresTextArea){
        var lang = $scope.current;

        // split block for all languages because
        // in loadInfoIntoInterface is after this function
        // also call calcUsagesForWords which operate
        // with splitedBlocks for all languages
        $scope.langs.forEach(function(langForBlock){
            blockOperators.splitBlocks(langForBlock.lang, $scope.info.translates[langForBlock.lang].info);
        })


        linksFactory.get(lang, blockOperators.words[lang], function(){
            showWordsInLineOfWords(lang, suppresTextArea);
        });

    }

    function showWordsInLineOfWords(lang, suppressTextArea){
        // line in editor
        var editLine = ''
        // line in list of words
        var lineOfWords = $('#lineofwords');
        lineOfWords.empty();

        blockOperators.words[lang].forEach(function(word){
            if(word.type == 1){
                editLine += '\n\n';
                lineOfWords.append('<div class="clearfix"></div><br/><br/>');
            } else if(word.type == 2) {
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
        searchFactory.search(lang, words[lang], $scope.current, function(){
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

    $scope.checkSelectedWord = function(lang){
        searchFactory.search(lang, [$scope.selectedWord], $scope.current, function(count){
            alertify.success(lang + ' "' + $scope.selectedWord.simple + '" : ' + count);
        }, true);
    }


    $scope.changeLang = function(lang){
        $scope.current = lang;
        splitBlocksAndShowInLine();
    }

    $scope.update = function(){
        update();
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
            splitBlocksAndShowInLine(lang, true);
        }, 2000)

    }




}