var happy = require('./lib/happy/happy.js');

// Start the server
happy.start();



module.exports = happy.getHapiServer();