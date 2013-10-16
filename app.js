var Hapi = require('hapi'),
    fs = require('fs'),
    test = require('./api/ctrl/VocCtrl.js');

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

function connectCtrl(ctrlpath, file){
    var filePath = './' + ctrlpath + '/' + file;


    if(filePath.indexOf(DEF_CTRL) == -1){
        console.error('sorry but file \'' + filePath + '\' is not a Controller, (ctrl end by ...' + DEF_CTRL);
        return;
    } else {
        console.info('controller found:' + filePath);
    }

    var module = require(filePath);

    var ctrlname = '/' + (file.split(DEF_CTRL)[0]).toLowerCase();

    for(var name in module){

        var shandler = module[name];
        //console.log('register' + file + '/' + name);
        if(typeof shandler === 'function'){
            var connect = ctrlname + '/' + name;
            console.log('register:' + connect);

            var superhello = {
                handler: shandler
            };

            // Add the route
            server.addRoute({
                method : 'GET',
                path : connect,
                config : superhello
            });
        }

    }

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
