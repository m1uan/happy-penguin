#!/usr/bin/env node

var Package = require('./engine/package.js')
    ,config = require('./config/local.js')
    ,pg = require('pg');


var dbuser = config.DB_USER_TEST;
var dbpass = config.DB_PASS_TEST;
var dbname = config.DB_NAME_TEST;
var connection = 'postgres://'+dbuser+':'+dbpass+'@localhost/' + dbname;
pgClient = new pg.Client(connection);


pgClient.connect(function(err, client){
    if(err){

        return console.info('could not connect to postgres', err);
    }

    console.log(process.argv);

    if(process.argv.length > 2){
        Package.createPackage(client, process.argv[2], function(err){
            client.end();
        })
    } else {
        client.end();
    }
});


