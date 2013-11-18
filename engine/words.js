var async = require('async'),
    Link = require('./link.js');

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

    var sql = 'SELECT lid, description, image.image as imagefile, iid as imageid, image.thumb as thumbfile, version, del FROM link' +
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

    if(!wordForUpdate || !wordForUpdate.link
        || !wordForUpdate.lang || !wordForUpdate.word || !wordForUpdate.record){
        return cb('wordForUpdate must contains : link, lang, word, record', false);
    }

    wordForUpdate.record = wordForUpdate.record.substring(0, 50);

    var sqlTest = 'SELECT version FROM word' +
        ' WHERE lang = $1 AND link = $2 AND word = $3 AND record = $4'

    var sqlTestValues = [wordForUpdate.lang, wordForUpdate.link, wordForUpdate.word, wordForUpdate.record];
    function retAllVersion(err, results){
        if(!err){
            module.exports.getWordWithHistory(pgClient, wordForUpdate.lang, wordForUpdate.link, function(err, data){
                cb(err, data);
            });
        } else {
            cb(err, false);
        }

    }

    pgClient.query(sqlTest, sqlTestValues, function(err, data){
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
        sqlParams.push(version);


        // specified words to update version
        if(wordForUpdate.word){
            updateWhere += ' AND word = $4'
            sqlParams.push(wordForUpdate.word);
        } else {
            cb('you can not update specific word version without wordForUpdate.word', null);
        }

        if(wordForUpdate.record){
            updateWhere += ' AND record = $5'
            sqlParams.push(wordForUpdate.record);
        }

    }

    var updateVersion = 'UPDATE word SET version=' + getMaxVersion;


    if(version == 0) {
        updateVersion += ',uts=now()';
    }

    updateVersion += updateWhere;

    console.log(updateVersion, sqlParams);

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
            '(lang, link, word, usr, record) ' +
            'VALUES' +
            '($1, $2, $3, $4, $5)';
        var sqlData = [wordForUpdate.lang, wordForUpdate.link, wordForUpdate.word, userId, wordForUpdate.record];
        console.log(insertSql, sqlData);


        pgClient.query(insertSql, sqlData, function(err, data){
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

    asyncLangsLoad.push(function(callback){
        module.exports.getImages(pgClient, lesson, function(err, images){
            callback(err, images);
        });
    });

    langs.forEach(function(val, idx){
        console.log(val);
        asyncLangsLoad.push(function(callback){
           module.exports.getWords(pgClient, val, lesson, function(words){
               callback(null, words);
           });
       });
    });


    async.parallel(asyncLangsLoad, cb);
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




    searchWords.forEach(function(sw, idx){
       if(sql.length > 0) {
           sql += ' UNION ';
       }
       sql += '(SELECT link.lesson as s, link.lid,'
           +   idx + " AS idx"
           +  ',link.description as d,'
           + ' (word1.word) as w1, word2.word as w2'
           + ' FROM link'
           + ' LEFT JOIN word as word1 ON word1.link = link.lid'
           + ' LEFT JOIN word as word2 ON word2.link = link.lid'
           + ' WHERE'
           + ' link.del < 1'
           + ' AND word1.lang = $1'
           + ' AND word2.lang = $2'
           + ' AND word1.version=0'
           + ' AND word2.version=0'

            + ' AND '
            + '('
            + '(lower(word1.word) SIMILAR TO'
            + " '(% )?("+sw[0]+")')"


           + 'OR (lower(word1.word) SIMILAR TO'
           + " '(% )?("+sw[1]+")')"
           + ')'

            + ' LIMIT 6)';


       //return false;
    });


    if(!err) {
        pg.query(sql, langs, function(err, data){
            if(err){
                console.log(err, sql);
                cb(err);
            } else {
                console.log(data, sql);

                var result = {};
                data.rows.forEach(function(rw){
                    result[rw.idx] = [];
                });

                data.rows.forEach(function(rw){
                    result[rw.idx].push({
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


/**
 *
 * @param pg
 * @param addWords
 * @param cb
 */
module.exports.addWord = function(pg, addWord, userId, cb){
   var errInfo = '';

   if(!addWord){
       errInfo = 'required parameter addWord is empty';
   } else {


       if(!addWord.n1){
           errInfo += 'missing param n1 (lang1)\n';
       }

       if(!addWord.w1){
           errInfo += 'missing param w1\n';
       }

       if(!addWord.r1){
           errInfo += 'missing param r1 (record1)\n';
       }

       if(!addWord.r2){
           errInfo += 'missing param r2 (record2)\n';
       }

       if(!addWord.n2){
           errInfo += 'missing param n2 (lang1)\n';
       }

       if(!addWord.w2){
           errInfo += 'missing param w2\n';
       }

       if(!addWord.s && !addWord.l){
           errInfo += 'missing param s (lesson) or l (link)\n';
       }

       if(!addWord.d){
           errInfo += 'missing param d (description)\n';
       }
   }



   //console.log(errInfo);

   if(errInfo){
       return cb(errInfo);
   }

   Link.update(pg, userId, {lid:addWord.l, description: addWord.d}, function(err, data){
       //console.log('error:',err, );
       if(!data[0]) {
           cb('link does not exists!');
       }
       addWordFromLink(pg, addWord, userId, cb);


   });
   //updateDescription(pg, addWord.l, addWord)


}

/***
 * crete new word on link, if exist both sides -> just update them
 * @param pg
 * @param addWord
 * @param link
 * @param cb
 */
function addWordFromLink(pg, addWord, userId, cb){

    async.parallel([
        function(icb) {
            var wu1 = {
                word : addWord.w1,
                lang : addWord.n1,
                record : addWord.r1,
                link : addWord.l
            } ;



            module.exports.updateWord(pg, wu1, userId, function(err){
                icb(err);
            });
        },function(icb) {
            var wu1 = {
                word : addWord.w2,
                lang : addWord.n2,
                record : addWord.r2,
                link : addWord.l
            } ;



            module.exports.updateWord(pg, wu1, userId, function(err){
                icb(err);
            });
        }
    ], cb)



}

function updateDescription(pg, link, desc, cb){
    var sql = 'UPDATE link SET description=$1 WHERE lid=$2';
    var sqlData = [link, desc];
    pg.query(sql, sqlData, function(err, data){
        console.log(sql, sqlData);
        if(err){
            cb(err);
        } else {
            cb(null, data.rowCount > 0);
        }
    });
}