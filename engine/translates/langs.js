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



    },addtranslate : function(pgClient, data, cb){
        var sql = 'INSERT INTO translates.link_t (key,description) VALUES ($1,$2) RETURNING link';


        pgClient.query(sql, [data.key,data.desc], function(err, user){
            if(err){
                cb(err || 'no user with this userName', false);
            } else {
                var row = user.rows[0];
                data.link = row.link;
                module.exports.translate(pgClient, data, cb);
            }
        });

    },translate : function(pgClient, data, cb){
        var SQL = SL.SqlLib('translates.translate_t');
        SQL.whereAnd('link=' + data.link + ' AND lang=\'' +data.lang +'\'');
        //var sql = SQL.generateUpsert({'link':data.link,data:data.desc,'lang':data.lang},['link']);

        SQL.upsert(pgClient,{'link':data.link,data:data.desc,'lang':data.lang},['link','data'], function(err, res){
            var out = null;
            if(!err){
                out = {
                    link : res[0].link,
                    data : res[0].data
                };
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
    }
}