


module.exports.getWords = function(pgClient, lang, lesson, cb) {
    if(!pgClient){
        cb(null);
        return;
    }

    var sql = 'SELECT link, word, lang, history FROM word WHERE lang= $1';

    console.log(sql)  ;
    pgClient.query(sql, ['cs'], function(err, data){

        if(err){
            console.log(err);
        }

        //console.log(data);
        //cb(err, {words: data.rows});
        cb(data.rows);
    });

}