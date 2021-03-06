#!/usr/bin/env node
// time ./pkgman.js 101 > /dev/null && time ./pkgman.js 1001 > /dev/null && time ./pkgman.js 2001 > /dev/null && time ./pkgman.js 3001 > /dev/null && time ./pkgman.js 4001 > /dev/null
var Package = require('./engine/package.js')
    ,config = require('./config/local.js')
    ,pg = require('pg')
    ,Async = require('async');


var dbname = config.DB_NAME;
var dbuser = config.DB_USER;
var dbpass = config.DB_PASS;
var dbport = config.DB_PORT;
var dbhost = config.DB_HOST;

var connection = 'postgres://'+dbuser+':'+dbpass+'@'+dbhost+':'+dbport+'/' + dbname;
pgClient = new pg.Client(connection);


pgClient.connect(function(err, client){
    if(err){

        return console.info('could not connect to postgres', err , connection);
    }

    console.log(process.argv);

    if(process.argv.length == 3){


        var param = process.argv[2];

        if(param == '--update'){
            updatePackages(client, function(err){
                client.end();
            });
        } else if(param == '--init'){

            var lessons1 = [  1001, 1002, 1003,1004, 1005, 2001, 2002, 2003, 2004, 2006, 2007, 2008, 3001, 3002, 3003, 3004, 3005, 3006, 3007, 3008, 4001, 4002, 4003, 4004, 4005, 4006, 4007, 4008, 4009, 4010, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110 ];
            var parallel = [];

            lessons1.forEach(function(less){
                parallel.push(function(icb){
                    Package.createPackage(client, less, function(err){
                        icb(err);
                    });
                });
            });

            Async.series(parallel, function(){
                client.end();
            });

        }else if(param > -1){
            Package.createPackage(client, param, function(err){
                client.end();
            })
        } else {
            console.log('wrong parameter (--update) or (101,102..)', param);
            client.end();
        }


    } else {
        client.end();
    }
});


function updatePackages(client, cb){
    Package.getPackageForUpdate(client, new Date('1.1.1990'), function(err, packages){
        var fups = [];

        if(!packages){
            console.log(err);
            return cb(err);
        }
        packages.forEach(function(pkg, idx){
            var fup = function(icb){
                var lsn = pkg.lesson;
                var langs = pkg.langs;

                Package.updatePackage(client, lsn, langs, function(err){
                    console.log('UPDATE : ',lsn, langs);
                    Package.removeUpdatePackage(client, lsn, function(err){
                        //client.query()
                        icb(null);
                    });

                })
            };

            fups.push(fup);

        });


        Async.series(fups, cb);

    });
}

