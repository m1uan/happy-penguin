var async = require('async'),
    Link = require('./link.js');

module.exports.lessonSize = 80;

var SQL_SELECT_WORD = 'SELECT link, word, lang,' +
    'word.version as version' +
    ' FROM word '


var SQL = function(table, mfields){
    var where  = '';
    var sqlData = [] ;
    var sqljoin = '';
    var sqlOrderBy = [];

    if(!mfields){
        mfields = [];
    }

    this.whereAnd = function(expression, expressionValue){
        if(!where){
            where = 'WHERE '
        } else {
            where += ' AND ';
        }

        if(!expressionValue && expressionValue !== 0){
            where += expression;

        } else {
            // expresion is without value
            // value is in expressionValue
            sqlData.push(expressionValue);
            where += expression +'$'+sqlData.length;
        }

        return this;
    }

    this.join = function (join, expression) {
        if(sqljoin){
           sqljoin += ' ';
        }

        // must be left join otherwise
        // the link images return just link with images not null
        sqljoin += 'LEFT JOIN ' + join + ' ON ' + expression;
        return this;
    }

    this.generateSelect = function(){
        var sql = 'SELECT ' + mfields.join(',') + ' FROM ' + table;
        if(sqljoin) {
            sql += ' ' + sqljoin;
        }

        if(where) {
            sql += ' ' + where;
        }

        var orderBy = sqlOrderBy.join(',');
        if(orderBy){
            sql += ' ORDER BY ' + orderBy;
        }
    }

    this.select = function(pg, callback){

        var sql = this.generateSelect();

        pg.query(sql, sqlData, function(err, data){
            console.log(err ? '#sql-generator-ERROR:':'#sql-generator:', sql, sqlData, err ?  err : '',data);
            callback(err, data ? data.rows : null);
        });

    }

    function generateInsert(insertData, upsert){

        var columnNames = '';
        var valuesId = '';
        var idx = 0;
        for(var column in insertData) {
            if (insertData.hasOwnProperty(column)) {
                columnNames += ',' + column;

                // in upsert was data add already in update... #look_update
                if(!upsert){
                    sqlData.push(insertData[column]);
                }
                idx++;
                valuesId += ',$' + idx;
            }

        }

        var sql = 'INSERT INTO ' + table + ' (' + columnNames.substring(1) + ')'
        if(!upsert){
           sql += 'VALUES(' + valuesId.substring(1) + ')';
        } else {
            sql += 'SELECT ' + valuesId.substring(1);
        }


        values.unshift(sql);

        return values;
    }

    function generateUpdate(updateData){

        var columnNames = '';

        for(var column in updateData) {
            if (updateData.hasOwnProperty(column)) {
                columnNames += ',' + column+'=$' + sqlData.length;
                // #look_update
                sqlData.push(updateData[column]);

            }

        }

        var sql = 'UPDATE ' + table + ' SET ' + columnNames.substring(1);

        values.unshift(sql);

        return values;
    }

    this.updateOrInsert = function(pg, uiData, returning, callback){

        if(!callback){
            callback = returning;
            returning = [];
        }

        var updateData = generateUpdate(uiData);
        var updateSql = updateData.shift();

        var insertData = generateInsert(uiData, true);
        var insertSql = insertData.shift();



        var notExists = new SQL(table,['1']);
        for(var column in uiData) {
            if (uiData.hasOwnProperty(column)) {
                // must add where fit value
                // because $1, $2, ... will be reachable from (SQL)notExists
                // but we have $1, $2, ... in our scope (SQL)this
                notExists.whereAnd(column+"='"+uiData[column]+"'");
            }
        }


        var notExistSql = notExists.generateSelect();

        if(where) {
            updateSql += ' ' + where;
            // in noExistsSql is WHERE like -> WHERE col1='1' AND col2='3'
            // we want add also our where -> so replace with WHERE col0=$1
            // -> WHERE col0=$1 AND col1='1' AND col2='3
            notExistSql.replace('WHERE', where);
        }

        insertSql += notExistSql;

        if(returning.length > 0){
            var returing = '';

            returning.forEach(function(ret){
                returing += ',' + ret;
            });

            returning = ' RETURNING ' + returing.substring(1);
            insertSql += returning;
            updateSql += returning;
        }

        var finalsql = updateSql + ';' + insertSql + ';';
        pg.query(finalsql, sqlData, function(err, data){
            console.log(err ? '#sql-generator-ERROR:':'#sql-generator:', finalsql, sqlData, err ?  err : '',data);
            callback(err, data ? data.rows : null);
        });
    }

    this.fields = function(f){
        mfields = f;
        return this;
    }

    this.addOrderBy = function(field){
        sqlOrderBy.push(field);
    }

    return this;
}




function WORDS(pg, lesson){
    var langs = [];
    var actual = true;
    var sql = new SQL('link');

    this.addLang = function (lang){
        langs.push(lang);
        return this;
    };

    this.question = function(fields, cb){
        sql.whereAnd('q_status>0');
        this.get(fields, cb);
    }

    this.get = function(fields, cb){

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

        sql.addOrderBy('link.lid');

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
                   if(f.indexOf('link') > -1){
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

module.exports.getWords = function(pgClient, lang, lesson, colums, cb) {
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

    if(!cb){
        cb = colums;
        colums = null;
    }

    if(!colums) {
        colums = ['link','lang','word','word.version as version'];
    }

    new module.exports.WORDS(pgClient, lesson).addLang(lang).get(colums, function(err,data){
        cb(data);
    });
}

module.exports.getImages = function(pgClient, lesson, colums, cb) {
    if(!pgClient){
        return cb('pgClient not setup', null);
    }

    if(!cb){
        cb = colums;
        colums = null;
    }

    if(!colums){
        colums = ['lid','description','image.image as imagefile','iid as imageid','image.thumb as thumbfile','version','del'];
    }
    new module.exports.WORDS(pgClient, lesson).get(colums, cb);

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
        });
    });

    langs.forEach(function(val, idx){
        console.log(val);
        asyncLangsLoad.push(function(callback){
           module.exports.getWords(pgClient, val, lesson, colums[1], function(words){
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