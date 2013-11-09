var assert = require("assert"),
    package = require('../../engine/package.js'),
    pg = require('pg'),
    should = require('should')
    , async = require('async')
    ,config = require('../../config/local.js');

var pgClient = null;

var sqlMake = require('../../lib/helps/helps.js').sqlMake;




describe('package operations', function(){

    before(function(cb){
        var dbuser = config.DB_USER_TEST;
        var dbpass = config.DB_PASS_TEST;
        var dbname = config.DB_NAME_TEST;
        var connection = 'postgres://'+dbuser+':'+dbpass+'@localhost/' + dbname;
        pgClient = new pg.Client(connection);


        pgClient.connect(function(err){
            if(err){

                return console.info('could not connect to postgres', err);
            }

            sqlMake(pgClient, [
                "select remove_test_data();select create_test_data();",
                //"SELECT create_test_data();",
                "SELECT generate_langs();",
                "DELETE FROM update_package;"
            ],cb);

        });
    });

    after(function(cb){
        sqlMake(pgClient, [
            "SELECT remove_test_data();"
        ],cb);
    });

    function testGetPackageForUpdate(lesson, cb){
        package.getPackageForUpdate(pgClient, function(err, packages){
            console.log(err || packages);
            packages.should.be.Array;
            packages.length.should.above(0);

            var package = packages[0];
            package.should.have.property('langs');
            package.langs.should.be.Array;
            package.langs.length.should.above(0);
            package.langs[0].should.be.String;

            cb();
        });
    }

    describe.only('download and store images', function(){
        it('update word', function(cb){
            testGetPackageForUpdate([{lesson:1,langs: [ 'de', 'cs', 'en' ]}], function(){


                cb();

            })

        });

    });




})