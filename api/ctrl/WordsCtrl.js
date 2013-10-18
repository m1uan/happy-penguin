var pg = require('pg')
    ,wordsEngine = require(process.cwd() + '/engine/words.js')
    ,async = require('async');
var pgclient = null;


module.exports = {

    // init
    $init : function(server, Hapi){
        var dbname = server.config_local.DB_NAME;
        var dbuser = server.config_local.DB_USER;
        var dbpass = server.config_local.DB_PASS;

        var connection = 'postgres://'+dbuser+':'+dbpass+'@localhost/' + dbname;
        console.info('db connection: ' + connection);
        pgclient = new pg.Client(connection);
        pgclient.connect(function(err){
            if(err){
                return console.info('could not connect to postgres', err);
            }

        });

        pgclient.query('SELECT NOW() AS "theTime"', function(err, result) {
            if(err) {
                return console.error('error running query', err);
            }
            console.log(result.rows[0].theTime);
            //output: Tue Jan 15 2013 19:12:47 GMT-600 (CST)
            //client.end();
        });


    },
    index_get : function (request){

        async.parallel([
            function(callback){
                wordsEngine.getWords(pgclient, 'cs', 1, function(words){
                    callback(null, words);
                });
            },
            function(callback){
                wordsEngine.getWords(pgclient, 'en', 1, function(words){
                    callback(null, words);
                });
            }
        ],
// optional callback
        function(err, results){
            var learnWordFist = results[0][0];
            var learnWordLast = results[0][results[0].length-1];
            wordsEngine.getImages(pgclient, learnWordFist.link, learnWordLast.link, function(err, images){
                if(err){
                    console.error(err);
                }

                results.push(images);
                request.reply(results);
            });



        });
    },
    ahoj_get : function (request){
        request.reply('ahoj_get');
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
//          pgclient.query(sql, [lang1, lang2], function(err, data){
//              //console.log(data);
//              cb(err, {words: data.rows});
//
//          });
//      }
//    }

}