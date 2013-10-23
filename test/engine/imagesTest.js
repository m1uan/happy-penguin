var assert = require("assert"),
    images = require('../../engine/image.js'),
    pg = require('pg'),
    should = require('should')
    , async = require('async')
    ,config = require('../../config/local.js');

var dboxClient = null;
var sqlMake = require('../../lib/helps/helps.js').sqlMake;

var imageForDelete = [];

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
        var remove = [
            "DELETE FROM link WHERE lid = 160002;"
        ];

        imageForDelete.forEach(function(val,idx){
            remove.push("DELETE FROM image WHERE iid =" + val);
        })
        sqlMake(pgClient,remove,cb);
    });


    describe('download and store images', function(){
        it('change image history', function(cb){
            var imgfile = 'http://0.tqn.com/d/motorcycles/1/0/f/o/-/-/Dyna_Wide_Glide_flames_static_TR.jpg';

            images.saveFromUrl(pgClient, 1, 160002, imgfile, function(err, rows){

                console.log(rows);
                assert(rows.length == 2);
                rows.forEach(function(val, idx){
                   if(val.version == 0){
                       assert(val.image);
                       assert(val.iid);
                       imageForDelete.push(val.iid);
                   }

                });

                assert(err == null, err);

                cb();
            });
        });

        it('change image history', function(cb){
            var imgfile = 'http://i.ebayimg.com/00/s/NzY4WDEwMjQ=/$T2eC16Z,!ygFIjmOMCutBSL031ezpg~~48_1.JPG';



            images.storeUrl(pgClient, 1,imgfile, function(err, iid1){
                images.storeUrl(pgClient, 1,imgfile, function(err, iid2){
                    assert(iid1 == iid2, 'The same image have been store 2times');
                    assert(err == null, err);

                    imageForDelete.push(iid1);
                    cb();
                });
            });
        });



    });




})