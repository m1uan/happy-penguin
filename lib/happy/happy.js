var Hapi = require('hapi'),
    fs = require('fs'),
    pg = require('pg');



var happy = {
    start : function(){
        start();
    }
}

    var DEF_CTRL = "Ctrl.js";
    var DEF_METHODS = ['_get', '_post', '_delete', '_put'];

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
        pgclient = new pg.Client(connection);
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


        if(filePath.indexOf(DEF_CTRL) == -1){
            console.error('sorry but file \'' + filePath + '\' is not a Controller, (engine end by ...' + DEF_CTRL);
            return;
        } else {
            console.info('controller found:' + filePath);
        }

        var ctrlWithHandlers = require(filePathFull);

        var ctrlname = (file.split(DEF_CTRL)[0]).toLowerCase();
        var handlerPath = ctrlname != 'index' ?  '/' + ctrlname + '/' : '/';


        for(var handlerName in ctrlWithHandlers){
            var handlerObject = ctrlWithHandlers[handlerName];
            if(typeof handlerObject === 'function'){

                if(handlerName == '$init'){
                    handlerObject(server, Hapi);
                } else {
                    getMethodAndRegisterRoute(handlerObject, handlerName, handlerPath);
                }

            } else {
                console.error('unknow route ' + handlerName + ' in ' + filePath);
            }



        }

    }

    function getMethodAndRegisterRoute(handlerObject, handlerName, handlerPath) {
        for (var methodIdx = 0; methodIdx <= DEF_METHODS.length; methodIdx++) {
            if (methodIdx == DEF_METHODS.length) {
                console.error('unknow method for handler ' + handlerName);

                var handlerMethods = '';
                DEF_METHODS.forEach(function (idx, val) {
                    handlerMethods += idx + ' '
                });
                console.info('possible methods for handler:' + handlerMethods);
                console.info('like: ' + handlerName + DEF_METHODS[0]);
                break;
            }


            var methodType = DEF_METHODS[methodIdx];
            if (handlerName.indexOf(methodType) != -1) {
                var handlerNameFinal = handlerName.split(methodType)[0];
                if (handlerNameFinal != 'index') {
                    handlerPath += handlerNameFinal;
                    //registerRoute(methodType, handlerPath + '/', handlerObject, 'extra?');
                    registerRoute(methodType, handlerPath + '/', handlerObject, '{params*}');
                }
                registerRoute(methodType, handlerPath, handlerObject, '');
                break;
            }
        }
        return {methodIdx: methodIdx, handlerMethods: handlerMethods, methodType: methodType, handlerNameFinal: handlerNameFinal};
    }

    function registerRoute(methodType, handlerPath, shandler, extra){
        //console.log('register' + file + '/' + name);
        var config_handler = {
            handler: shandler
        };

        var setRoute = {
            method : methodType.substr(1),
            path : handlerPath + extra ,
            config : config_handler
        };

        console.log('route ' + setRoute.method + ' ' + setRoute.path)
        // Add the route
        server.addRoute(setRoute);
    }




module.exports = happy;