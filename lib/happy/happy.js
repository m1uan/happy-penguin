var Hapi = require('hapi'),
    fs = require('fs');



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


    function start(){
        // Create a server with a host, port, and options
        server = new Hapi.Server(ipaddress, port);


        try{
            server.config_local = require(process.cwd() + '/config/local.js');
        } catch(err){
            server.config_local = null;
            console.warn('you can add you personal local setting');
        }


        var ctrlpath = 'api/ctrl';
        fs.exists(ctrlpath, function(exists){
            if(exists){

                var files = fs.readdirSync(ctrlpath);
                for(var file in files){
                    connectCtrl(ctrlpath, files[file]);
                }
            }


        });


        server.start(function(){
            console.log(ipaddress + ':' +port);
        });
    }

    function connectCtrl(ctrlpath, file){
        var procCwd = process.cwd();
        var filePath = ctrlpath + '/' + file;
        var filePathFull =  procCwd + '/' + filePath;


        if(filePath.indexOf(DEF_CTRL) == -1){
            console.error('sorry but file \'' + filePath + '\' is not a Controller, (ctrl end by ...' + DEF_CTRL);
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
                    registerRoute(methodType, handlerPath + '/', handlerObject);
                }
                registerRoute(methodType, handlerPath, handlerObject);
                break;
            }
        }
        return {methodIdx: methodIdx, handlerMethods: handlerMethods, methodType: methodType, handlerNameFinal: handlerNameFinal};
    }

    function registerRoute(methodType, handlerPath, shandler){
        //console.log('register' + file + '/' + name);
        var config_handler = {
            handler: shandler
        };

        var setRoute = {
            method : methodType.substr(1),
            path : handlerPath,
            config : config_handler
        };

        console.log('route ' + setRoute.method + ' ' + setRoute.path)
        // Add the route
        server.addRoute(setRoute);
    }




module.exports = happy;