var Hapi = require('hapi')
    , fs = require('fs');

// Create a server with a host, port, and options
var server = new Hapi.Server('localhost', 3000);

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

// Start the server
server.start();