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