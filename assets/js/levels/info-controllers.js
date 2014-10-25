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


        self.diffWordUsages = function(actUsages, prevUsages){
            //var actualWordCount = self.calcUsagesForWordsForAllLangs();
            var diffUsages = {}

            // difference between actualWordCount and usagesWords
            // example is loadet text 'Hello[101] Milan[103], Hello[101]...
            // so usagesWords will looks like : {'101' : 2, '103' : 1, ...
            // if no-body will change text and update reference = usages should be {'101' : 0, '103' : 0, ...
            // thats meand no changes with usages
            // but when somebody change text and update reference like
            // 'Hello[101] Milan[103], Hi[102]...
            // usages hold look like {'101' : -1, '102' : 1, ...
            // thats mean ref 101 decrease and ref 102 increase
            for(var awcLink in actUsages){
                if(prevUsages[awcLink]){
                    // it was exist before so diff between act a prev
                    diffUsages[awcLink] = actUsages[awcLink] - prevUsages[awcLink];
                } else {
                    // it didn't exist before so actual is also diff
                    diffUsages[awcLink] = actUsages[awcLink];
                }
            }

            // if someone removed
            for(var uLink in prevUsages){
                if(diffUsages[uLink] == undefined){
                    // it is minus because before was present
                    // now is doesn't present so actual diff is less about prev...
                    diffUsages[uLink] = -prevUsages[uLink];
                }
            }

            return diffUsages;

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
                sentence : self.removeWordLinks(sentence),
                sentences : [],
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


        self.generatePayloadForUpdateUsagesRequest = function(diffUsages){
            var payload = null;
            for(var diff in diffUsages){
                diff = parseInt(diff);

                var d = diffUsages[diff];
                // 0 means no difference so is not necessary send
                // to server about do nothing
                if(d !== 0){

                    // if no any change function return null
                    if(!payload){
                        payload = {};
                    }

                    if(payload[d]){
                        payload[d].push(diff);
                    } else {
                        payload[d] = [diff];
                    }
                }
            }

            return payload;
        }

        self.removeWordLinks = function(sentenceWithLinks){
            var patt = new RegExp('\[[0-9]*\]', 'gm');
            //var res = patt.exec(sentenceWithLinks);

            return sentenceWithLinks.replace(patt, '');
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

    // search by english or curretnt (true -english)
    $scope.searchWordLang = true;
    // result of search in czech or current (true - czech)
    $scope.searchWordLang2 = false;

    $scope.show_edit_text = false;

    var _searchedWords = {};
    var _linkedWords = {};


    var blockOperators;
    var usagesWords;



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
            // count diff have to be before loadInfoIntoInterface
            // because after callback will 'usagesWords' will be actualized
            updateUsages();
            loadInfoIntoInterface();
        });
    }

    function updateUsages(){
        // could happend the user press "update" button
        // faster then is update background of blocks
        // cancel the timer and update manualy for current language
        if(setTimeOutForUpdate){
            clearTimeout(setTimeOutForUpdate);
            setTimeOutForUpdate = null;
            splitBlocksAndShowInLine($scope.current, true);
        }

        var actUsages = blockOperators.calcUsagesForWordsForAllLangs();
        var diff = blockOperators.diffWordUsages(actUsages, usagesWords);
        var payload = blockOperators.generatePayloadForUpdateUsagesRequest(diff);

        // if no difference don't send request
        if(payload){
            requestPOST($http, '/words/usages/', {usages: payload}, function(response, status){

            });
        }

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
        searchFactory.search(lang, blockOperators.words[lang], $scope.current, function(){
            showWordsInLineOfWords(lang);
        });


    }

    function checkSelectedWordForSentences(lang, word){
        if(!word.link){
            return ;
        }

        var czechReverse = false;
        var notReversedLang = lang;
        if(lang == 'en'){
            czechReverse = true;
            lang = 'cz';
        }

        linksFactory.getSentencesToLink(lang, word.link, function(sentences){




            $timeout(function(){
                word.sentences = [];
                var wordSentences = [];

                sentences.forEach(function(sen){
                    var included = word.sentences.some(function(s){
                        return s.l == sen.l;
                    });

                    if(!included){
                        // reversed version - in eng you will got eng for desc and eng for current lang
                        // in this case is current switch to czech, but in view have to be reverse
                        // eng with czech for better understanding and also when you will edit,
                        // the first will be eng version and second will be czech version
                        // THE SAME IS IN CREATE - first ENG and second CZ
                        if(czechReverse){
                            wordSentences.push({l:sen.l,e:sen.s, s:sen.e});
                        } else {
                            wordSentences.push(sen);
                        }
                    }

                })

                searchFactory.search(notReversedLang, [word], czechReverse ? 'cz' : 'en', function(count){
                    // function serach automaticaly add to the sentences array
                    // if should be reverse, reverse it
                    word.sentences.forEach(function(sen){
                        if(czechReverse){
                            wordSentences.push({l:sen.l,e:sen.s2, s:sen.e});
                        } else {
                            wordSentences.push(sen);
                        }
                    })
                    word.sentences = wordSentences;


                }, true, true);

            },0)


        });



    }

    function selectWord(el, word, lang){

        $timeout(function(){


            $scope.selectedWord = word;
            $scope.checkSelectedWord();




            $('.inner-words').removeClass('inner-words-selected');
            $('#inner-word-' + word.id).addClass('inner-words-selected');
            /*
            $('#search-words-table tr').removeClass('search-words-table-select-row');
            $('#search-words-table tr:first-child').addClass('search-words-table-select-row');*/
        }, 0)



        //$('#connect-word-' + word.id).text('ahoj');
        console.log(el, word.word);
    }

    $('#search-words-table tr:first-child').addClass('search-words-table-select-row');

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
            //word.possibleSentences = [];

            // show line take first word in possible
            // to show in underline word
            // move selected word to first position
            wordMoveSelectedUp(word, poss);
        } else {
            // remove
            word.link = null;
            $('#search-words-table tr').removeClass('search-words-table-select-row');

        }


        showWordsInLineOfWords($scope.current);
        // $scope.$apply is called in callback
        checkSelectedWordForSentences($scope.current, word);
    }



    $scope.checkSelectedWord = function(){

        // if is switch of search word select to search by english
        // or search by current
        var lang = $scope.searchWordLang ? 'en' : $scope.current;

        // result of words - default english
        // if is current eng set to cz (results in czech)
        var lang2 = $scope.searchWordLang2 ? 'cz' :  $scope.current;


        searchFactory.search(lang, [$scope.selectedWord], lang2, function(count){
            alertify.success(lang + ' "' + $scope.selectedWord.simple + '" : ' + count);
        }, true);
    }


    $scope.changeLang = function(lang){
        $scope.current = lang;
        $("[name='search-lang-choice']").bootstrapSwitch('offText',$scope.current);
        $("[name='search-lang2-choice']").bootstrapSwitch('offText',$scope.current);
        splitBlocksAndShowInLine();
    }

    $scope.update = function(){
        update();
    }

    $scope.check = function(){
        wordsCheck($scope.current);
    }

    function addWordRequest(desc, w1, w2){
        // l1 always en
        var l1 = 'en';
        // if en language is the second word add in cz
        var l2 = $scope.current == 'en' ? 'cz' : $scope.current;
        // fix cz to cs because server operate in cs
        l2 = l2 == 'cz' ? 'cs' : l2;



        var payload = {"word":
            {
                "s":"8001",
                "w1":w1,
                "w2":w2,
                "d":desc,
                "n1":l1,
                "n2":l2,
                "r1":'|'+l2+'|'+w1,
                "r2":'|'+l1+'|'+w2
             }
        }
        requestPOST($http, '/words/addword?type=api', payload, function(response, status){
            wordsCheck($scope.current);
        });
    }

    $scope.addWord = function(){
        if(!$scope.selectedWord.english || !$scope.selectedWord.simple){
            alertify.alert('booth fields have to be filled')
        } else {
            alertify.prompt('Write description about add word', function(e,data){
                if(e){
                   if(!data){
                       alertify.error('description was empty');
                   } else {
                       addWordRequest(data, $scope.selectedWord.english, $scope.selectedWord.simple);

                   }
                }

            })
            //addWordRequest


        }
    }

    function addWordPossibilty(poss, updated){

        var lang = $scope.current == 'cz' ? 'cs' : $scope.current;

        var payload = {
            "lang": lang,
            "link": poss.lid,
            "word": updated,
            "record":poss.word2 + "|en|" + poss.english}
        requestPOST($http, '/words/update?type=api', payload, function(response, status){
            poss.word2 = updated;
            // remove from history, if you will change somethink
            // and try find possible words, it is all cached in factory
            // remove cache history for actualize by new data with updated word
            searchFactory.removeFromFoundWords($scope.current, updated);
            searchFactory.removeFromFoundWords('en',poss.english);
        });
    }

    $scope.editPossibility = function(poss){
        alertify.prompt('Edit possible word', function(e,data){
            if(e){
                if(data){
                    searchFactory.removeFromFoundWords($scope.current, data);
                    addWordPossibilty(poss, data);
                } else {
                    alertify.alert('Edit field was empty!');
                }
            }

        }, poss.word2);
    }

    $scope.showEditText = function(){
        $scope.show_edit_text = !$scope.show_edit_text;
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

    function sentenceCreateAndEdit(sentence, toLink, senEnglish, link){
        var info1 = 'Sentence in ' + $scope.current;
        alertify.prompt(info1, function(e, sentence){
            if(e){
                if(!sentence){
                    alertify.alert(info1 + ' : could be not empty!');
                } else {
                    // if you are in english lang , select as second language czech
                    // otherwise the user will add the czech both sentence will be in english
                    var lang = $scope.current == 'en' ? 'cz' : 'en';
                    var info2 = '('+sentence+') in ' + lang;
                    alertify.prompt(info2, function(e2, senEnglish){
                        if(e2){
                            if(!senEnglish){
                                alertify.alert(info2 + ' : can not be empty');
                            } else {
                                // code here
                                var dataContainer = {
                                    toLink : toLink
                                }

                                dataContainer.english = $scope.current == 'en' ? sentence : senEnglish;
                                dataContainer.sentence = $scope.current == 'en' ? senEnglish : sentence;
                                dataContainer.lang = $scope.current == 'en' ? 'cz' : $scope.current;

                                requestPOST($http, '/words/screate/', dataContainer, function(response, status){
                                    var newSentence = {e:response.d};
                                    newSentence.s = sentence;
                                    newSentence.l = toLink;
                                    $scope.selectedWord.sentences.push(newSentence);
                                });

                            }
                        }

                    }, senEnglish);
                }
            }

        }, sentence);
    }

    $scope.sentenceCreate = function(sentence, toLink){
        sentenceCreateAndEdit(sentence, toLink)
    }

    $scope.sentenceEdit = function(sentence, toLink){
        sentenceCreateAndEdit(sentence.s, toLink, sentence.e, sentence.l)
    }

    var searchLangSwitch = $("[name='search-lang-choice']");
    searchLangSwitch.bootstrapSwitch('onText','en');
    searchLangSwitch.bootstrapSwitch('offText',$scope.current);
    searchLangSwitch.on('switchChange.bootstrapSwitch',  function (e, data) {
        console.log(data)
        $scope.searchWordLang = data;
        $scope.checkSelectedWord();
    });

    var searchLangSwitch = $("[name='search-lang2-choice']");
    searchLangSwitch.bootstrapSwitch('onText','cz');
    searchLangSwitch.bootstrapSwitch('offText',$scope.current);
    searchLangSwitch.on('switchChange.bootstrapSwitch',  function (e, data) {
        $scope.searchWordLang2 = data;
        $scope.checkSelectedWord();
    });


}