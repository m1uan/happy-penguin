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
                cb(null, user.rows[0]);
            }
        });



    },addtranslate : function(pgClient, data, cb){
        var sql = 'INSERT INTO translates.link_t (key,description) VALUES ($1,$2) RETURNING link';


        pgClient.query(sql, [data.key,data.desc], function(err, user){
            if(err){
                cb(err || 'no user with this userName', false);
            } else {
                var row = user.rows[0];
                var SQL = SL.SqlLib('translates.translate_t');


                SQL.upsert(pgClient,{link:row.link,data:data.desc,lang:data.lang},['link'], cb);
            }
        });

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