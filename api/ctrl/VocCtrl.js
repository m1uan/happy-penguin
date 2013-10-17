var pg = require('pg');
var pgclient = null;


module.exports = {

    // init
    $init : function(server, Hapi){
        var dbname = server.config_local.DB_NAME;
        var dbuser = server.config_local.DB_USER;
        var dbpass = server.config_local.DB_PASS;

        var connection = 'postgres://'+dbuser+':'+dbpass+'@localhost/' + dbname;
        console.info('db connection: ' + connection);
        pgclient = new pg.Client(connection);
        pgclient.connect(function(err){
            if(err){
                return console.info('could not connect to postgres', err);
            }

        });

        pgclient.query('SELECT NOW() AS "theTime"', function(err, result) {
            if(err) {
                return console.error('error running query', err);
            }
            console.log(result.rows[0].theTime);
            //output: Tue Jan 15 2013 19:12:47 GMT-600 (CST)
            //client.end();
        });


    },
    index_get : function (request){
            request.reply('index_get');
    },
    ahoj_get : function (request){
        request.reply('ahoj_get');
    }
}