var async = require('async');

module.exports.lessonSize = 8;


module.exports.getWords = function(pgClient, lang, lesson, cb) {
    if(!pgClient){
        cb(null);
        return;
    }

    if(lesson < 1){
        console.log('index lesson from 1 current :', lesson);
        return cb(null);
    }


    var lessonStart = (lesson-1) * module.exports.lessonSize;
    var lessonEnd = lessonStart + module.exports.lessonSize;

    var sql = 'SELECT link, word, lang, history FROM word WHERE lang = $1 OFFSET $2 LIMIT $3';

    console.log(sql)  ;
    pgClient.query(sql, [lang, lessonStart, lessonEnd], function(err, data){

        if(err){
            console.log(err);
        }

        //console.log(data);
        //cb(err, {words: data.rows});
        cb(data.rows);
    });

}

module.exports.getImages = function(pgClient, linkFrom, linkTo, cb) {
    if(!pgClient){
        return cb('pgClient not setup', null);
    }

    var sql = 'SELECT link, image, history FROM image WHERE link >= $1 and link < $2';

    console.log(sql)  ;
    pgClient.query(sql, [linkFrom, linkTo], function(err, data){
       if(err){
           cb(err, null);
       } else {
           cb(err, data.rows);
       }


    });
}


module.exports.getWordsWithImages = function(pgClient, langs, lesson, cb){
    async.parallel([
        function(callback){
            module.exports.getWords(pgClient, langs[0], lesson, function(words){
                callback(null, words);
            });
        },
        function(callback){
            module.exports.getWords(pgClient, langs[1], lesson, function(words){
                callback(null, words);
            });
        }
    ],
// optional callback
        function(err, results){
            var learnWordFist = results[0][0];
            var learnWordLast = results[0][results[0].length-1];
            module.exports.getImages(pgClient, learnWordFist.link, learnWordLast.link, function(err, images){
                results.push(images);
                cb(err, results);
            });



        });
}