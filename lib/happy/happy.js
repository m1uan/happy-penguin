var Hapi = require('hapi'),
    fs = require('fs'),
    pg = require('pg'),
    happyCtlr = require('./happyCtrl.js');



var happy = {
    start : function(){
        start();
    }
}




// Create a server with a host, port, and options
    var server;

    var ipaddress = process.env.OPENSHIFT_NODEJS_IP;
    var port      = 8080;


var options = {
    views: {
        engines: { jade: 'jade' },
        path: process.cwd() + '/views',
        compileOptions: {
            pretty: true
        }
    }
};


    function start(){
        // Create a server with a host, port, and options
        server = new Hapi.Server(ipaddress, port, options);

        console.log('view setting : ' + options.views.path);
        try{
            server.config_local = require(process.cwd() + '/config/local.js');
        } catch(err){
            server.config_local = null;
            console.warn('you can add you personal local setting');
        }






        // first database - because is linked in server
        // and server is parameter for init of controller
        initDB(function(err, pgClient){
            if(err){
                console.error('Database not connected! error: ' + err);
                server.pgClient = null;
            } else {
                server.pgClient = pgClient;
            }

            // password
            require(process.cwd() + '/passport.js').initialize(Hapi, server);

            var ctrlpath = 'api/ctrl';
            fs.exists(ctrlpath, function(exists){

                if(exists){
                    //console.log(ctrlpath + 'exists');
                    var files = fs.readdirSync(ctrlpath);
                    for(var file in files){
                        connectCtrl(ctrlpath, files[file]);
                    }
                }
            });

            server.start(function(){
                console.log(ipaddress + ':' +port);

            });
        });


    }

    function initDB(cb){
        var dbname = server.config_local.DB_NAME;
        var dbuser = server.config_local.DB_USER;
        var dbpass = server.config_local.DB_PASS;
        var dbport = server.config_local.DB_PORT;
        var dbhost = server.config_local.DB_HOST;

        var connection = 'postgres://'+dbuser+':'+dbpass+'@'+dbhost+':'+dbport+'/' + dbname;
        console.info('db connection: ' + connection);
        var pgclient = new pg.Client(connection);
        pgclient.connect(function(err){
            cb(err, pgclient);

            // test query
            pgclient.query('SELECT NOW() AS "theTime"', function(err, result) {
                if(err) {
                    return console.error('error running query', err);
                }
                console.log(result.rows[0].theTime);
                //output: Tue Jan 15 2013 19:12:47 GMT-600 (CST)
                //client.end();
            });
        });


    }

    function connectCtrl(ctrlpath, file){
        var procCwd = process.cwd();
        var filePath = ctrlpath + '/' + file;
        var filePathFull =  procCwd + '/' + filePath;


        if(filePath.indexOf(happyCtlr.DEF_CTRL_NAME) == -1){
            console.error('sorry but file \'' + filePath + '\' is not a Controller, (engine end by ...' + DEF_CTRL);
            return;
        } else {
            console.info('controller found:' + filePath);
        }

        var ctrlWithHandlers = happyCtlr.handler(filePathFull, file, server, Hapi);



    }






module.exports = happy;