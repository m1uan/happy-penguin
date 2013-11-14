#!/usr/bin/env node
// time ./pkgman.js 101 > /dev/null && time ./pkgman.js 1001 > /dev/null && time ./pkgman.js 2001 > /dev/null && time ./pkgman.js 3001 > /dev/null && time ./pkgman.js 4001 > /dev/null
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
        var lessons1 = [ 101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 1001, 1002, 1003,1004, 1005, 2001, 2002, 2003, 2004, 2005, 2006, 2007, 2008, 3001, 3002, 3003, 3004, 3005, 3006, 3007, 3008, 4001, 4002, 4003, 4004, 4005, 4006, 4007, 4008, 4009, 4010 ];
        lessons1.forEach(function(less){

        });
        Package.createPackage(client, process.argv[2], function(err){
            client.end();
        })
    } else {
        client.end();
    }
});


