var assert = require("assert"),
    images = require('../../engine/image.js'),
    pg = require('pg'),
    should = require('should')
    , async = require('async')
    ,config = require('../../config/local.js');

var dboxClient = null;
var sqlMake = require('../../lib/helps/helps.js').sqlMake;

describe('image-dropbox', function(){

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

            sqlMake(pgClient,[
                "INSERT INTO link (lid,description) VALUES (160002,'descrpsdf sad fdas f');"
            ],cb);

        });
    });

    after(function(cb){
        sqlMake(pgClient,[
            "DELETE FROM link WHERE lid = 160002;"
            ],cb);
    });


    describe('download and store images', function(){
        it('change image history', function(cb){
            var imgfile = 'http://t2.gstatic.com/images?q=tbn:ANd9GcRr0WK-Q2t4Xxr1b6Kl7-lXdVEIh_Hj3HiDXk--Qg_0UAY0Y96P6w';



            images.saveFromUrl(pgClient, 1, imgfile, function(err, name){
                console.log(err);
                cb();
            });
        });

    });




})