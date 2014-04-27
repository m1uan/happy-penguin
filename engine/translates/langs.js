var LocalStrategy = require('passport-local').Strategy,
    SL = require(process.cwd() + '/lib/happy/sqllib.js');

module.exports = {
    initialize : function(server, Passport) {

    },addlang : function(pgClient, data, cb){
        var sql = 'INSERT INTO translates.lang_t (lang,name) VALUES ($1,$2)';


        pgClient.query(sql, [data.lang,data.name], function(err, user){
            if(err){
                cb(err || 'no user with this userName', false);
            } else {
                if(data.lang_of_name){
                    var translateData = {
                        key : '_' + data.name.toLowerCase(),
                        desc : data.name,
                        lang : data.lang_of_name

                    }
                    module.exports.addtranslate(pgClient, translateData, function(err2, outdata){

                        if(outdata){
                            var sqlUpdate = 'UPDATE translates.lang_t SET link=$1 WHERE lang=$2';

                            pgClient.query(sqlUpdate, [outdata.link, data.lang], function(err3, data2){
                                cb(err3, user.rows[0]);
                            });
                        } else {
                            cb(err2, null);
                        }



                    });
                } else {
                    cb(null, user.rows[0]);
                }


            }
        });



    },updatedesc : function(pgClient, data, cb){
        var SQL = SL.SqlLib('translates.link_t');
        SQL.whereAnd('link=' + data.link);
        //var sql = SQL.generateUpsert({'link':data.link,data:data.desc,'lang':data.lang},['link']);


        if(isNaN(data.group)){
            data.group = 0;
        }

        SQL.update(pgClient,{'"desc"':data.desc,'"key"':data.key,'"group"':data.group,'changed':'now()'}, function(err, res){
            cb(err, res);
        });
    },addtranslate : function(pgClient, data, cb){

        if(isNaN(data.group)){
            data.group = 0;
        }

        if(!data.desc){
            cb('missing column desc');
            return;
        }

        if(!data.key){
            data.key = null;
        }


        var sql = 'INSERT INTO translates.link_t ("key","desc","group") VALUES ($1,$2,$3) RETURNING link,"desc","key","group"';


        pgClient.query(sql, [data.key,data.desc, data.group], function(err, user){
            if(err){
                cb(err || 'no user with this userName', false);
            } else {
                var row = user.rows[0];
                data.link = row.link;
                data.data = row.desc;
                data.desc = row.desc;
                data.group = row.group;
                module.exports.translate(pgClient, data, cb);
            }
        });

    },translate : function(pgClient, data, cb){

        if(!data.lang){
            data.lang = 'en';
        }

        var SQL = SL.SqlLib('translates.translate_t');
        SQL.whereAnd('link=' + data.link + ' AND lang=\'' +data.lang +'\'');
        //var sql = SQL.generateUpsert({'link':data.link,data:data.desc,'lang':data.lang},['link']);

        SQL.upsert(pgClient,{'link':data.link,data:data.data,'lang':data.lang},['link','data'], function(err, res){
            var out = null;
            if(!err){
                out = {
                    link : res[0].link,
                    data : res[0].data
                };

                // from add translate - in this table doesnt
                if(data.key){
                    out.key = data.key;
                }
                if(data.desc){
                    out.desc = data.desc;
                }
                if(!isNaN(data.group)){
                    out.group = data.group;
                }

            }
            cb(err, out);
        });
    },getlangs : function(pgClient, fields, data, cb){
        var sql = 'SELECT lang,name FROM translates.lang_t (key,description) VALUES ($1,$2) RETURNING link';

        var indexOfTranslate = fields.indexOf("translate");

        if(indexOfTranslate > -1){
            if(!data.lang_of_names){
                cb('field \'translate\' is preset but not specified lang (data.lang_of_names)');
                return;
            }
            fields[indexOfTranslate] = 'translates.translate_t.data as translate';
        }

        var indexOfLang = fields.indexOf("lang");
        if(indexOfLang > -1){
            fields[indexOfLang] = 'translates.lang_t.lang as lang';
        }

        var SQL = SL.SqlLib('translates.lang_t', fields);

        if(indexOfTranslate > -1){
            var join =  'translates.lang_t.link=translates.translate_t.link AND translates.translate_t.lang=\'' + data.lang_of_names + '\'';
            SQL.join('translates.translate_t',join);
        }


        SQL.select(pgClient, cb);
    }
    ,getUserByName : function(pgClient, userName, cb){
        var sql = 'SELECT id, name, full_name, pass,admin FROM usr WHERE name = $1';

        console.log(sql)  ;
        pgClient.query(sql, [userName], function(err, user){
            if(err || user.rows.length < 1){
                cb(err || 'no user with this userName', false);
            } else {
                cb(null, user.rows[0]);
            }
        });
    },getUserById : function(pgClient, id, cb){
        var sql = 'SELECT id, name, full_name,admin FROM usr WHERE id = $1';

        console.log(sql)  ;
        pgClient.query(sql, [id], function(err, user){
            if(err || user.rows.length < 1){
                cb(err || 'no user with this id', false);
            } else {
                cb(null, user.rows[0]);
            }
        });
    },setLastLogin : function(pgClient, userId, cb){
        console.log('ahoj now()');
        var sql = new SL.SqlLib('usr');
        sql.whereAnd('id='+userId);
        sql.update(pgClient, {last_login:'now()'}, function(err, data){
            console.log(err ? err : data);
          cb(err, data);
        })
    },get: function(pgClient, fields, data, cb){
// example data
//        var data = {
//            lang :  'cz',
//            page : 0,
//            second: 'en',
//            lastUpdateFirst: true - for editor first show the last updated,
//              group : number - select just the translates from group
//        };

        if(!data.lang){
            cb('data.lang missing!');
            return ;
        }

        // in fields could be desc instead description
        var indexOfDesc = fields.indexOf("desc");

        if(indexOfDesc > -1){
            fields[indexOfDesc] = '"desc"';
        }

        var indexOfGroup = fields.indexOf("group");
        if(indexOfGroup > -1){
            fields[indexOfGroup] = '"group"';
        }

        var indexOfLink = fields.indexOf("link");

        if(indexOfLink > -1){
            fields[indexOfLink] = 'translates.link_t.link as link';
        }

        var indexOfData = fields.indexOf("data");
        var indexOfKey = fields.indexOf("key");


        var sql = new SL.SqlLib('translates.link_t', fields);
        if(indexOfData > -1 || indexOfKey > -1){

            var join = 'translates.translate_t.link=translates.link_t.link AND (translates.translate_t.lang=\''+data.lang +'\'';

            // for selecting and the language is not there use second lang
            // in most cases will be en because is base
            if(data.second){
                join += ' OR translates.translate_t.lang=\''+data.second +'\'';
            }

            join += ')';

            sql.join('translates.translate_t',join);
        }


        // TODO: page moving
        // var size=100;
        //sql.offset(data.page * size);
        //sql.limit((data.page+1) * size);

        // for normal purpose
        if(data.lastUpdateFirst){
            sql.addOrderBy('link_t.changed DESC');
        }

        if(!isNaN(data.group)){
            sql.whereAnd('"group"='+data.group.toString());
        }

        sql.select(pgClient, cb);
    },delete:function(pg, dataContainer, cb){
        if(!dataContainer.link){
            cb('missing link');
            return;
        }

        pg.query("DELETE FROM translates.translate_t USING translates.link_t WHERE translates.link_t.link = "+ dataContainer.link+" AND translates.translate_t.link = translates.link_t.link;"
            + ";DELETE FROM translates.link_t WHERE translates.link_t.link=" + dataContainer.link
            , [], function(err, data){
                cb(err, dataContainer);
            });
    }
}