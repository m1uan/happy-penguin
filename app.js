var Hapi = require('hapi')
    , fs = require('fs');

var ipaddress = process.env.OPENSHIFT_NODEJS_IP;
var port      = process.env.OPENSHIFT_NODEJS_PORT || 8080;

console.log('starting');

// Create a server with a host, port, and options
var server = new Hapi.Server();

// Define the route
var hello = {
    handler: function (request) {

        request.reply({ greeting: 'hello world' });
    }
};

// Add the route
server.addRoute({
    method : 'GET',
    path : '/hello',
    config : hello
});

console.log(ipaddress + ':' +port);
// Start the server
server.start();
