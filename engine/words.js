var async = require('async'),
    Link = require('./link.js'),
    SQL = require('../lib/happy/sqllib.js');;

module.exports.lessonSize = 80;

var SQL_SELECT_WORD = 'SELECT link, word, lang,' +
    'word.version as version' +
    ' FROM word '


function WORDS(pg, lesson){
    var langs = [];
    var actual = true;
    var sql = new SQL.SqlLib('link');
    var user = -1;
    var _words = this;

    this.setUser = function(usr){
        user=usr;

        return _words;
    }

    this.addLang = function (lang){
        langs.push(lang);
        return _words;
    };

    this.question = function(fields, onlyUser, cb){
        if(!cb){
            cb = onlyUser;
            onlyUser = false;
        }

        sql = new SQL.SqlLib('question_status_t qs');
        sql.join('link','qs.link=link.lid');

        fields.push('qs.status as qstatus');
        var indexOfUserStatusInFields = fields.indexOf('@userstatus');

        if(indexOfUserStatusInFields != -1){
            //fields.push('CASE WHEN (SELECT 1 FROM question_t WHERE link )');

            //fields.push('qm.changed as qmchanged');
            //fields.push('(SELECT MAX(question_t.changed) FROM question_t WHERE question_t.link=link.lid AND question_t.usr='+user+') AS userpresed')
            fields[indexOfUserStatusInFields] = 'CASE WHEN (SELECT MAX(question_t.changed) FROM question_t WHERE question_t.link=link.lid AND question_t.usr='+user+') IS NOT NULL THEN (qs.status+100) ELSE COALESCE(qs.status, 0) END AS userstatus';
            //sql.joinRight('question_t qm','qm.link=qs.link AND qm.usr='+user);

        }

        if(indexOfUserStatusInFields){

        }

        sql.addOrderBy('qs.changed desc');
        //sql.whereAnd('qs.status IS NOT NULL');

        if(onlyUser){
            sql.whereAnd('(SELECT MAX(question_t.changed) FROM question_t WHERE question_t.link=link.lid AND question_t.usr='+user+') IS NOT NULL');
        }

        //fields.push('qs.status as qstatus');
        //fields.push('qm.changed as qmchanged');
        //fields.push('CASE WHEN qm.changed IS NOT NULL THEN (qs.status+100) ELSE COALESCE(qs.status, 0) END AS userstatus');

        this.getInner(fields, cb);
    }

    this.get = function(fields, cb, notDeletedAndNotUnaproved){
        // question are ordered by date time changed
        sql.addOrderBy('link.lid');

        var indexOfUserStatusInFields = fields.indexOf('@userstatus');

        if(indexOfUserStatusInFields != -1){
            fields.push('qs.status as qstatus');
            fields.push('qm.changed as qmchanged');
            fields[indexOfUserStatusInFields] = 'CASE WHEN qm.changed IS NOT NULL THEN (qs.status+100) ELSE COALESCE(qs.status, 0) END AS userstatus'
        }

        if(fields.indexOf('qs.status as qstatus') != -1 || indexOfUserStatusInFields > -1){
            sql.join('question_status_t qs','qs.link=link.lid');
        }

        if(fields.indexOf('qm.changed as qmchanged') != -1 || indexOfUserStatusInFields > -1){
            sql.join('question_t qm','qm.link=qs.link AND qm.usr='+user);
        }

        if(notDeletedAndNotUnaproved === true){
            sql.whereAnd('del=0') ;
            //sql.whereAnd('(flag=1 OR flag=4)') ;
        }

        this.getInner(fields, cb);
    }


    /*
        type =  -1 - all
                0 - waiting
                1 - approved
                2 - disaproved
                4 - system
     */
    this.approveImages = function(fields, type, cb){
        // question are ordered by date time changed
        //sql.addOrderBy('link.lid');

        var indexOfUserStatusInFields = fields.indexOf('@userstatus');

        if(indexOfUserStatusInFields != -1){
            fields.push('qs.status as qstatus');
            fields.push('qm.changed as qmchanged');
            fields[indexOfUserStatusInFields] = 'CASE WHEN qm.changed IS NOT NULL THEN (qs.status+100) ELSE COALESCE(qs.status, 0) END AS userstatus'
        }

        if(fields.indexOf('qs.status as qstatus') != -1 || indexOfUserStatusInFields > -1){
            sql.join('question_status_t qs','qs.link=link.lid');
        }

        if(fields.indexOf('qm.changed as qmchanged') != -1 || indexOfUserStatusInFields > -1){
            sql.join('question_t qm','qm.link=qs.link AND qm.usr='+user);
        }

        if(user > -1){
            sql.whereAnd('link.usr=', user);
        }

        if(type > -1) {
            sql.whereAnd('link.flag=',type);
        }

        sql.whereAnd('link.image IS NOT NULL');

        sql.addOrderBy('link.flag');

        this.getInner(fields, cb);
    }

    this.getInner = function(fields, cb){

        if(!fields){
            cb('fields missing');
            return;
        }





        if(fields.indexOf('image.image as imagefile') != -1){
            sql.join('image','link.image=image.iid');
        }

        if(lesson){
            sql.whereAnd('link.lesson=',lesson);
        }



        if(actual){
            sql.whereAnd('link.version=',0);
        }



        if(langs.length == 1){
            sql.join('word', 'word.link=link.lid');
            sql.whereAnd('word.lang=',langs[0]);
            if(actual){
                sql.whereAnd('word.version=',0);
            }
        } else if(langs.length > 1){
            langs.forEach(function(lang,midx){
                var idx = midx + 1;
                sql.join('word as word'+idx, 'word'+idx+'.link=link.lid');
                sql.whereAnd('word'+idx+'.lang=',lang);
                if(actual){
                    sql.whereAnd('word'+idx+'.version=',0);
                }
            });

            var newFields = [];

            fields.forEach(function(f,idx){

               if(isWordsFields(f)){

                   langs.forEach(function(lang,mlidx){
                       var lidx =mlidx +1;
                       // convert word.col -> word1.col
                       var fnew = f.replace('word.','word'+lidx+'.');

                       // convert word -> word1.word
                       fnew = fnew.replace('word','word'+lidx+'.word');
                       // convert lang -> word1.lang
                       fnew = fnew.replace('lang','word'+lidx+'.lang');
                       // convert version -> word1.version
                       fnew = fnew.replace('version','word'+lidx+'.version');
                       // convert record -> word1.record
                       fnew = fnew.replace('record','word'+lidx+'.record');

                       // convert word1.col as col -> word1.col as col1
                       if(fnew.toLowerCase().indexOf(' as ') > 0){
                           fnew += lidx;
                       } else {
                          // convert: word1.col -> word1.col as col1
                           fnew += ' AS ' + fnew.split('.')[1] + lidx;
                       }
                       newFields.push(fnew);

                   });

               } else {
                   //var linkIdx = f.indexOf('link');
                   if(f == 'link'){
                       f = 'lid as link';
                   }

                   newFields.push(f);
               }
            });

            fields = newFields;

        }



        sql.fields(fields).select(pg, cb);
    };


    function isWordsFields(field){
        if(typeof(String.prototype.trim) === "undefined")
        {
            String.prototype.trim = function()
            {
                return String(this).replace(/^\s+|\s+$/g, '');
            };
        }

        field = field.trim();
        if(field.indexOf('word.') == 0){
            return true;
        }

        var wordFields = ['word','lang','record','version'];

        var found = false;
        wordFields.some(function(val){
            found = field.indexOf(val) == 0;
            return found;
        });


        return found;
    }


    return this;

};

module.exports.WORDS = WORDS;

module.exports.getWords = function(pgClient, lang, lesson, colums, cb, notDeletedAndNotApproved) {
    if(!cb){
        cb = colums;
        colums = null;
    }

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



    if(!colums) {
        colums = ['link','lang','word','word.version as version'];
    }

    new module.exports.WORDS(pgClient, lesson).addLang(lang).get(colums, function(err,data){
        cb(data);
    }, notDeletedAndNotApproved);
}

module.exports.getImages = function(pgClient, lesson, colums, cb, notDeletedAndNotApproved) {
    if(!pgClient){
        return cb('pgClient not setup', null);
    }

    if(!cb){
        cb = colums;
        colums = null;
    }

    if(!colums){
        colums = ['lid','description','image.image as imagefile','iid as imageid','image.thumb as thumbfile','version','del','flag'];
    }

    new module.exports.WORDS(pgClient, lesson).get(colums, cb, notDeletedAndNotApproved);

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
    console.log(wordForUpdate);

    if(!wordForUpdate || !wordForUpdate.link
        || !wordForUpdate.lang || !wordForUpdate.word || !wordForUpdate.record){
        return cb('wordForUpdate must contains : link, lang, word, record', false);
    }

    wordForUpdate.record = wordForUpdate.record.substring(0, 50);

    // #RECORD EDIT:
    // remove record because otherwise when you are add word
    // and system trying if is word in db and because the
    // record will be in system differend when the record on update word
    // system will add new word with new version but only change will be the record
    // this record also will be recorded in word from second language
    // which will be created (in add proces are contain booth words - w1 and w2)
    var sqlTest = 'SELECT version FROM word' +
        ' WHERE lang = $1 AND link = $2 AND word = $3' // AND record = $4

    var sqlTestValues = [wordForUpdate.lang, wordForUpdate.link, wordForUpdate.word]; //, wordForUpdate.record];
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

//        LOOK TO : #RECORD EDIT:
//        if(wordForUpdate.record){
//            updateWhere += ' AND record = $5'
//            sqlParams.push(wordForUpdate.record);
//        }

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

module.exports.getWordsWithImages = function(pgClient, langs, lesson, colums, cb){
    var asyncLangsLoad = [];

    if(!cb){
        cb = colums;
        colums = null;
    }

    if(!colums){
        colums = [null, null];
    }


    asyncLangsLoad.push(function(callback){
        module.exports.getImages(pgClient, lesson, colums[0], function(err, images){
            callback(err, images);
        }, true);
    });

    langs.forEach(function(val, idx){

        asyncLangsLoad.push(function(callback){
           module.exports.getWords(pgClient, val, lesson, colums[1], function(words){
               callback(null, words);
           }, true);
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

        var w0 = sw[0];
        var w1 = sw[0];

       sql += '(SELECT link.lesson as s, link.lid,'
           +   idx + " AS idx"
           +  ',link.description as d,'
           + ' (word1.word) as w1, word2.word as w2'
           + ' FROM link'
           + ' JOIN word as word1 ON word1.link = link.lid'
           + ' JOIN word as word2 ON word2.link = link.lid'
           + ' WHERE'
           + ' link.del < 1'
           + ' AND word1.lang = $1'
           + ' AND word2.lang = $2'
           + ' AND word1.version=0'
           + ' AND word2.version=0'

            + ' AND '
            + '('
            + '(lower(word1.word) SIMILAR TO'
            + " '(% )?("+w0+")')"


           + 'OR (lower(word1.word) SIMILAR TO'
           + " '(% )?("+w1+")')"
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

// http://phpjs.org/functions/addslashes/
function cleanTextForSql(textData){
    return (textData + '').replace(/'/g, '$&');
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

    addWord.w1 = cleanTextForSql(addWord.w1);
    addWord.w2 = cleanTextForSql(addWord.w2);
   //console.log(errInfo);

   if(errInfo){
       return cb(errInfo);
   }

   if(addWord.l){
       Link.update(pg, userId, {lid:addWord.l, description: addWord.d}, function(err, data){

           //console.log(data);
           //console.log('error:',err, );
           if(!data[0]) {
               cb('link does not exists!');
           }
           addWordFromLink(pg, addWord, userId, cb);
       });
   } else {
       var sql = 'INSERT INTO link (lid,lesson,description,usr) VALUES ((SELECT max(lid) + 1 FROM link),$1,$2,$3) RETURNING lid, description';
       var sqlData = [addWord.s, addWord.d, userId];

       pg.query(sql, sqlData, function(err, linkData){
           var resultWord = {};
           console.log('error:',err, linkData );
           if(err) {
               cb('link does not created!');
           }
           addWord.l = linkData.rows[0].lid;
           addWord.d = linkData.rows[0].description;
           addWordFromLink(pg, addWord, userId, cb);
       });
   }

   //updateDescription(pg, addWord.l, addWord)


}

module.exports.usage = function(pg, usages, cb){
    if(!usages || typeof usages !== 'object'){
        cb('usage is not a object');
    }

    var parallel = [];

    for(usage in usages){
        parallel.push(generateUpdate(usage, usages[usage]));
    }


    function generateUpdate(usage, links){
        return function(icb){
            var sql = new SQL.SqlLib('link');
            sql.whereAnd('lid IN (' + links.join(',') + ')');
            var cd1 = 'usage=coalesce(usage,0)+'+usage+'';
            var ud = {};
            ud[cd1] = null;
            sql.update(pg, ud, icb);
        }
    }

    async.parallel(parallel, function(err){

        // update all link with negative usage
        // just for sure
        var sql = new SQL.SqlLib('link');
        sql.whereAnd('usage<=0');
        var ud = {'usage' : null};
        sql.update(pg, ud, function(e,d){
            cb(e, {});
        });

    })


}

module.exports.search = function(pg, search, cb){
    if(!search.words || !search.words.length) {
        cb('word missing or is not array');
        cb();
    }

    searchOrLinks(pg, search, cb);
}

module.exports.links = function(pg, search, cb){
    if(!search.links || !search.links.length) {
        cb('links missing or is not array');
        cb();
    }

    searchOrLinks(pg, search, function(err, data){
        if(err){
            cb(err);
            return ;
        }
        // data are in format (because search could have for one word more rows)
        // data[0]
        //   words[0]
        // data[1]
        //    word[0]
        // from link is not possible - simplify it
        var ret = [];
        data.forEach(function(d){
            ret.push(d[0]);
        });

        cb(err, ret);
    });
}

function searchOrLinks(pg, search, cb){
    if(!search.lang){
        cb('lang is missing');
        return;
    }

    if(!search.fields){
        search.fields = ['lid']
    }

    var indexOfWord = search.fields.indexOf('word');
    if(indexOfWord > -1){
        search.fields[indexOfWord] = 'word1.word as word'
    }

    // if you want the word with two languages
    var indexOfWord2 = search.fields.indexOf('word2');
    if(indexOfWord2 > -1){
        search.fields[indexOfWord2] = 'word2.word as word2'
        if(!search.lang2){
            cb('you need field word2 but lang2 is missing');
            return;
        }
    }

    // if you want the word also in eng language
    var indexOfEngllish = search.fields.indexOf('english');
    if(indexOfEngllish > -1){
        search.fields[indexOfEngllish] = 'word3.word as english'
    }

    var indexOfDesc = search.fields.indexOf('desc');
    if(indexOfDesc > -1){
        search.fields[indexOfDesc] = 'link.description as desc'
    }

    var parallel = [];

    // if contain words is standart search function
    if(search.words){
        search.words.forEach(function(word){
            parallel.push(function(icb){
                return searchWord(icb, word);
            })
        });
    }

    // if contain links is standart get function
    if(search.links){
        search.links.forEach(function(link){
            parallel.push(function(icb){
                return searchWord(icb, null, link);
            })
        });
    }


    async.parallel(parallel, cb);


    function searchWord(icb, word, link){
        var sql = new SQL.SqlLib('link', search.fields);
        sql.join('word as word1', 'word1.link = link.lid');
        sql.whereAnd('link.del < 1');
        sql.whereAnd('word1.lang =\''+search.lang+'\'');
        sql.whereAnd('link.version =0');
        sql.whereAnd('word1.version =0');
        if(word){
            var searchString;

            if(!search.properly){
                searchString = "(% )?("+word+")";
            } else {
                searchString = "(%)?("+word+")(%)?";
            }

            sql.whereAnd("(lower(word1.word) SIMILAR TO '"+searchString+"')");
        }

        if(link){
            sql.whereAnd("lid="+link);
        }

        if(indexOfWord2){
            sql.join('word as word2', 'word2.link = link.lid AND word2.lang =\''+search.lang2+'\'');
        }

        if(indexOfEngllish){
            sql.join('word as word3', 'word3.link = link.lid AND word3.lang =\'en\'');
        }

        sql.select(pg, icb);
    }
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



            module.exports.updateWord(pg, wu1, userId, function(err, data){
                icb(err,data);
            });
        },function(icb) {
            var wu1 = {
                word : addWord.w2,
                lang : addWord.n2,
                record : addWord.r2,
                link : addWord.l
            } ;

            module.exports.updateWord(pg, wu1, userId, function(err, data){
                icb(err, data);
            });
        }
    ], function(err, wordData){
        if(err){
            return cb(err);
        }

        console.log(wordData[0], wordData[1]);

        var resultWord = {};
        resultWord.l = addWord.l;
        resultWord.d = addWord.d;
        resultWord.w1 = wordData[0];
        resultWord.w2 = wordData[1];
        cb(null, resultWord);
    })



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