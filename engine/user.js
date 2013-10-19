var LocalStrategy = require('passport-local').Strategy;

module.exports = {
    initialize : function(server, Passport) {

    }
    ,getUserByName : function(pgClient, userName, cb){
        var sql = 'SELECT id, name, full_name, pass FROM usr WHERE name = $1';

        console.log(sql)  ;
        pgClient.query(sql, [userName], function(err, user){
            if(err || user.rows.length < 1){
                cb(err || 'no user with this userName', false);
            } else {
                cb(null, user.rows[0]);
            }
        });
    },getUserById : function(pgClient, id, cb){
        var sql = 'SELECT id, name, full_name FROM usr WHERE id = $1';

        console.log(sql)  ;
        pgClient.query(sql, [id], function(err, user){
            if(err || user.rows.length < 1){
                cb(err || 'no user with this id', false);
            } else {
                cb(null, user.rows[0]);
            }
        });
    }
}