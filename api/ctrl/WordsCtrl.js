var wordsEngine = require(process.cwd() + '/engine/words.js')
    ,async = require('async');

var pgClient = null;

module.exports = {

    // init
    $init : function(server, Hapi){
        pgClient = server.pgClient;

    },
    // get Hapi Config
    $getConfig : function(){
        return {
            auth : 'passport'
            ,params : '{params*}'
            ,test_get : {
                auth : false
            },lesson_get : {
                params : '{params*}'
            }
        }
    },
    test_get : function(request){
      request.reply('heelo');
    },
    index_get : function (request){


        //console.log(request.getParam('l2'));
        wordsEngine.getWordsWithImages(pgClient, ['cs', 'en'], 1, function(err, words){
            request.reply(err ? err : words);
        });
    },
    lesson_get : function (request){

        //console.log(request.getParam('l2'));
        //  http://localhost:8080/words/lesson/2/de/cs
        if(request.params.params && request.params.params.length > 0){
            var langs = request.params.params.split('/');
            var lesson = langs.shift();

            console.log(langs);
            console.log(lesson);

            wordsEngine.getWordsWithImages(pgClient, langs, lesson, function(err, words){
                request.reply(err ? err : words);
            });
        } else {
            request.reply('format : /lesson/lang1/lang2/{lang3?}');
        }
    }


//    ,wordsControler : function(){
//      function getWord(lang1, lang2, cb){
//          var sql = 'SELECT word.word as word1cs, w2.word as word2en, word.lang, w2.lang, image.image from word ' +
//              + ' LEFT JOIN word w2 on word.link = w2.link ' +
//              + ' LEFT JOIN image on word.link=image.link ' +
//              +' WHERE word.lang= $1 AND w2.lang= $2 ' +
//              +' AND word.link > 10 AND word.link < 20';
//
//          //console.log(sql)  ;
//          pgClient.query(sql, [lang1, lang2], function(err, data){
//              //console.log(data);
//              cb(err, {words: data.rows});
//
//          });
//      }
//    }

}