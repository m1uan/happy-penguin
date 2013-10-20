var async = require('async');

module.exports.lessonSize = 80;

var SQL_SELECT_WORD = 'SELECT link, word, lang, version FROM word '

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

    //var sql = SQL_SELECT_WORD + ' WHERE lang = $1 OFFSET $2 LIMIT $3';
    // changed from limit to link, otherwise after update the updated
    // words not in words sed more
    var sql = SQL_SELECT_WORD + ' WHERE lang = $1 AND link >= $2 AND link < $3';

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

    var sql = 'SELECT link, image, version FROM image WHERE link >= $1 and link < $2';

    console.log(sql)  ;
    pgClient.query(sql, [linkFrom, linkTo], function(err, data){
       if(err){
           cb(err, null);
       } else {
           cb(err, data.rows);
       }
    });
}


module.exports.getWordWithHistory = function(pgClient, lang, link, cb){
    var sql = SQL_SELECT_WORD + ' WHERE lang = $1 and link = $2';
    console.log(sql);
    console.log(lang);
    console.log(link);
    pgClient.query(sql, [lang, link], function(err, data){
        if(err){
            cb(err, null);
        } else {
            cb(err, data.rows);
        }


    });
}

module.exports.updateWord = function(pgClient, wordForUpdate, userId, cb) {
    if(!pgClient){
        return cb('pgClient not setup', null);
    }

    if(!wordForUpdate || !wordForUpdate.link || !wordForUpdate.lang || !wordForUpdate.word){
        cb('wordForUpdate must contains : link, lang, word', false);
    }

    var sqlTest = 'SELECT version FROM word' +
        ' WHERE lang = $1 AND link = $2 AND word = $3'


    function retAllVersion(err, results){
        if(!err){
            module.exports.getWordWithHistory(pgClient, wordForUpdate.lang, wordForUpdate.link, function(err, data){
                cb(err, data);
            });
        } else {
            cb(err, false);
        }

    }

    pgClient.query(sqlTest, [wordForUpdate.lang, wordForUpdate.link, wordForUpdate.word], function(err, data){
        if(err) {
           cb(err, false);
        } else if(data.rows.length == 0){
            createNewWordAndSetNewVersionToOld(pgClient, wordForUpdate, userId, retAllVersion);
        } else {

            reuseOldVersion(pgClient, wordForUpdate, retAllVersion);
        }
    });

}

function reuseOldVersion(pgClient, wordForUpdate, cb){
    function updateActualWordToNewVersion(cb){
        updateVersionToWord(pgClient, wordForUpdate, cb)
    }

    function updateOldWordToVersion0(cb){
        updateVersionToWord(pgClient, wordForUpdate, 0,  cb)
    }

    console.log(wordForUpdate);
    async.series([
        updateActualWordToNewVersion
        , updateOldWordToVersion0
    ], cb);
}

function updateVersionToWord(pgClient, wordForUpdate, version, cb){

    var updateWhere = ' WHERE lang = $1 AND link = $2';
    var getMaxVersion = '';

    var sqlParams = [
        wordForUpdate.lang,
        wordForUpdate.link];

    if(!cb){
        cb = version;

        // count version from last one
        getMaxVersion = '(SELECT max(version)+1 FROM word'
            + updateWhere
            + ')';

        // must be after getMaxVersion
        updateWhere += ' AND version = 0';
    } else {

        // ----------------
        // version to value
        getMaxVersion = '$3';
        sqlParams.push(0);


        // specified words to update version
        if(wordForUpdate.word){
            updateWhere += ' AND word = $4'
            sqlParams.push(wordForUpdate.word);
        } else {
            cb('you can not update specific word version without wordForUpdate.word', null);
        }

    }

    var updateVersion = 'UPDATE word SET version = '
        + getMaxVersion
        + updateWhere;

    console.log(updateVersion);

    pgClient.query(updateVersion, sqlParams, function(err, data){
        if(err) {
            cb(err, null);
        } else {
            cb(err, data);
        }
    });
}

function createNewWordAndSetNewVersionToOld(pgClient, wordForUpdate, userId, cb) {


    function updateUsageWord(cb){
        updateVersionToWord(pgClient, wordForUpdate, cb)
    }

    function insertNew(cb){


        var insertSql = 'INSERT INTO word ' +
            '(lang, link, word, usr) ' +
            'VALUES' +
            '($1, $2, $3, $4)';

        console.log(insertSql);

        pgClient.query(insertSql, [wordForUpdate.lang, wordForUpdate.link, wordForUpdate.word, userId], function(err, data){
            if(err) {
                cb(err, null);
            } else {
                cb(err, data);
            }
        });
    }



    async.series([
        updateUsageWord,
        insertNew
    ], cb) ;

}

module.exports.getWordsWithImages = function(pgClient, langs, lesson, cb){
    var asyncLangsLoad = [];

    langs.forEach(function(val, idx){
        console.log(val);
        asyncLangsLoad.push(function(callback){
           module.exports.getWords(pgClient, val, lesson, function(words){
               callback(null, words);
           });
       });
    });


    async.parallel(asyncLangsLoad,
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