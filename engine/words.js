var async = require('async');

module.exports.lessonSize = 80;

var SQL_SELECT_WORD = 'SELECT link, word, lang,' +
    'word.version as version' +
    ' FROM word '

module.exports.getWords = function(pgClient, lang, lesson, cb) {
    if(!pgClient){
        cb(null);
        return;
    }

    if(lesson < 1){
        console.log('index lesson from 1 current :', lesson);
        return cb(null);
    }

    if(!lang || typeof lang !== 'string'){
        console.log('lang is not defined or isn\' in good format :', lang);
        return cb('lang is not defined or isn\' in good format :');
    }

    //var lessonStart = (lesson-1) * module.exports.lessonSize;
    //var lessonEnd = lessonStart + module.exports.lessonSize;

    //var sql = SQL_SELECT_WORD + ' WHERE lang = $1 OFFSET $2 LIMIT $3';
    // changed from limit to link, otherwise after update the updated
    // words not in words sed more
    var sql = SQL_SELECT_WORD;
    sql += ' JOIN link ON link.lid = word.link' ;
    sql += ' WHERE lang = $1 AND link.lesson = $2'
    sql += ' AND word.version = 0'
    sql += ' ORDER BY word.link'
    //sql += ' LIMIT 50';

    var sqlval = [lang, lesson];
    //console.log('module.exports.getWords', sql, sqlval)  ;
    pgClient.query(sql, sqlval, function(err, data){

        if(err){
            console.log(err);
        }

        //console.log(data);
        //cb(err, {words: data.rows});
        cb(data.rows);
    });

}

module.exports.getImages = function(pgClient, lesson, cb) {
    if(!pgClient){
        return cb('pgClient not setup', null);
    }

    var sql = 'SELECT lid, description, image.image as imagefile, iid as imageid, image.thumb as thumbfile, version FROM link' +
        ' LEFT JOIN image ON link.image = image.iid' +
        ' WHERE link.lesson = $1';
    var sqlData = [lesson];
    console.log(sql, sqlData)  ;
    pgClient.query(sql,sqlData , function(err, data){
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

            module.exports.getImages(pgClient, lesson, function(err, images){
                results.unshift(images);
                cb(err, results);
            });
        });
}

/**
 *
 * @param pg
 * @param lang
 * [ 'lang 1', 'lang 2'
 * ]
 * @param searchWords
 * [
 *  'link_of_search_word 1',
 *  'link_of_search_word 2',
 *  ...
 * ]
 *
 *
 *
 *
 * @param cb(err, data)
 * [
 *  'link_of_search_word' : { s: lesson, lid: current_link, w1: 'word in lang 1', w2: 'word in lang 2' },
 * 'link_of_search_word' : { s: 2004, lid: 1125, w1: 'Osmý 8.', w2: 'achte 8.' },
 * 'link_of_search_word' : { s: 4001, lid: 2039, w1: 'Litva', w2: 'zerstören' },
 * 'link_of_search_word' :  { s: 4001, lid: 2099, w1: 'Litva', w2: 'stattfinden' }
 * ]
 */
module.exports.getRepeatWords = function(pg, langs, searchWords, cb){
    var sql = '';
    var err = '';

    if(langs.length != 2){
        return cb('getRepeatWords: langs param should contain two param for languages');
    }


    searchWords.some(function(sw, idx){
       if(sql.length > 0) {
           sql += ' UNION ';
       }
       sql += '(SELECT link.lesson as s, link.lid, '
           + sw + ' as l, link.description as d,'
           + ' word1.word as w1, word2.word as w2'
           + ' FROM link'
           + ' LEFT JOIN word as word1 ON word1.link = link.lid'
           + ' LEFT JOIN word as word2 ON word2.link = link.lid'
           + ' WHERE'
           + ' link.lid != ' + sw
           + ' AND word1.lang = $1'
           + ' AND word2.lang = $2'


            + ' AND ((lower(word1.word) SIMILAR TO '
            + "(SELECT '(% )?(' || lower(word) || ')' FROM word WHERE lang = $1 AND link =" + sw
            + ' AND version=0) AND word1.version=0 )'

            + ' OR (lower(word2.word) SIMILAR TO '
            + "(SELECT '(% )?(' || lower(word) || ')' FROM word WHERE lang = $2 AND link =" + sw
            + '  AND version=0) AND word2.version=0 ))'

            + ' LIMIT 5)';


       return false;
    });


    if(!err) {
        pg.query(sql, langs, function(err, data){
            if(err){
                console.log(err, sql);
                cb(err);
            } else {
                console.log(data, sql);

                var result = {};
                searchWords.forEach(function(sw){
                    result[sw] = [];
                });

                data.rows.forEach(function(rw){
                    result[rw.l].push({
                       s : rw.s,
                       l : rw.lid,
                       w1 : rw.w1,
                       w2 : rw.w2,
                       d: rw.d
                    });
                });


                cb(err, result);
            }
        })  ;
    } else {
        return cb(err);
    }
}