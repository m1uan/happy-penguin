var Hapi = require('hapi'),
    fs = require('fs'),
    test = require('./api/ctrl/IndexCtrl.js');

var ipaddress = process.env.OPENSHIFT_NODEJS_IP;
var port      = 8080;

console.log('starting');

// Create a server with a host, port, and options
var server = new Hapi.Server(ipaddress, port);

// Define the route
var hello = {
    handler: function (request) {

        request.reply({ greeting: 'hello world' });
    }
};


var DEF_CTRL = "Ctrl.js";
var DEF_METHODS = ['_get', '_post', '_delete', '_put'];

function connectCtrl(ctrlpath, file){
    var filePath = './' + ctrlpath + '/' + file;


    if(filePath.indexOf(DEF_CTRL) == -1){
        console.error('sorry but file \'' + filePath + '\' is not a Controller, (ctrl end by ...' + DEF_CTRL);
        return;
    } else {
        console.info('controller found:' + filePath);
    }

    var ctrlWithHandlers = require(filePath);

    var ctrlname = (file.split(DEF_CTRL)[0]).toLowerCase();
    var handlerPath = ctrlname != 'index' ?  '/' + ctrlname + '/' : '/';


    for(var handlerName in ctrlWithHandlers){
        var handlerObject = ctrlWithHandlers[handlerName];
        if(typeof handlerObject === 'function'){
            for(var methodIdx = 0; methodIdx <= DEF_METHODS.length; methodIdx++){
                if(methodIdx == DEF_METHODS.length) {
                    console.error('unknow method for handler ' + handlerName);

                    var handlerMethods = '';
                    DEF_METHODS.forEach(function(idx, val) {handlerMethods+=idx + ' '});
                    console.info('possible methods for handler:'+handlerMethods);
                    console.info('like: ' + handlerName+DEF_METHODS[0]);
                    break;
                }
                var methodType = DEF_METHODS[methodIdx];
                if(handlerName.indexOf(methodType) != -1){
                    var handlerNameFinal = handlerName.split(methodType)[0];
                    if(handlerNameFinal != 'index'){
                        handlerPath += handlerNameFinal;
                        registerRoute(methodType, handlerPath + '/', handlerObject) ;
                    }
                    registerRoute(methodType, handlerPath, handlerObject) ;
                    break;
                }
            }
        } else {
            console.error('unknow route ' + handlerName + ' in ' + filePath);
        }



    }

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


var ctrlpath = 'api/ctrl';
fs.exists(ctrlpath, function(exists){
   if(exists){

       var files = fs.readdirSync(ctrlpath);
       for(var file in files){
           connectCtrl(ctrlpath, files[file]);
       }
   }


});

console.log(ipaddress + ':' +port);
// Start the server
server.start();
