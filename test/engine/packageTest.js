var assert = require("assert"),
    link = require('../../engine/package.js'),
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
                "INSERT INTO image (iid,image,md5) VALUES (150000,'karel.jpg', 'karel');"
                ,"INSERT INTO image (iid,image,md5) VALUES (150001,'karel2.jpg', 'karel2');"
                ,"INSERT INTO link (lid,description,lesson) VALUES (160000,'descrpsdf sad fdas f',1);"
                ,"INSERT INTO link (lid,description,image,lesson) VALUES (160001,'descrpsdf sad fdsafa ', 150000,1);"
            ],cb);

        });
    });

    after(function(cb){
        sqlMake(pgClient, [
            "DELETE FROM image WHERE iid = 150000;"
            ,"DELETE FROM image WHERE iid = 150001;"
            ,"DELETE FROM link WHERE lid= 160000;"
            ,"DELETE FROM link WHERE lid= 160001;"
        ],cb);
    });


    describe('download and store images', function(){
        it('update word', function(cb){

           icb(null);



        });

    });




})