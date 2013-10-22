var assert = require("assert"),
    link = require('../../engine/link.js'),
    pg = require('pg'),
    should = require('should')
    , async = require('async')
    ,dbox = require('dbox')
    ,config = require('../../config/local.js');

var pgClient = null;

function sqlMake(commands, cb){

    var as = [];

    commands.forEach(function(val, idx){
        as.push(function(icb)
        {
            console.log(val)  ;
            pgClient.query(val, function(err, data){
                if(err){
                    icb(err, null);
                } else {
                    icb(err, true);
                }
            });
        });
    });


    async.parallel(as,
        function(err){
            if(err){
                console.log(err);
            }
            cb();
    });
}


describe('link operations', function(){

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

            sqlMake([
                "INSERT INTO image (iid,image,md5) VALUES (150000,'karel.jpg', 'karel');"
                ,"INSERT INTO image (iid,image,md5) VALUES (150001,'karel2.jpg', 'karel2');"
                ,"INSERT INTO link (lid,description) VALUES (160000,'descrpsdf sad fdas f');"
                ,"INSERT INTO link (lid,description,image) VALUES (160001,'descrpsdf sad fdsafa ', 150000);"
            ],cb);

        });
    });

    after(function(cb){
        sqlMake([
            "DELETE FROM image WHERE iid = 150000;"
            ,"DELETE FROM image WHERE iid = 150001;"
            ,"DELETE FROM link WHERE lid= 160000;"
            ,"DELETE FROM link WHERE lid= 160001;"
        ],cb);
    });


    describe('download and store images', function(){
        it('update word', function(cb){

            var linkData = {lid : 160000, image : 150000, description: 'ahoj jak sa mas'}

            var length = 0;

            linkGet = function(icb){
                link.get(pgClient, linkData.lid, ['image'], function(err, links){

                    console.log(links);
                    console.log('get');
                    if(links[0].description){

                        linkData.description = links[0].description + links.length;;
                    }
                    length = links.length;
                    icb(null);
                });
            }

            function linkUpdate(icb){
                console.log(linkData);
                link.updateAndGet(pgClient, 2, linkData, ['image'], function(err, links){
                    console.log(links);
                    console.log(err);

                    assert(links.length == length + 1);
                    assert(links[0].iid == linkData.image);
                    assert(links[0].description == linkData.description);
                    assert(links[0].usr == 2);
                    icb(null);
                });
            }

            async.series([
                linkGet,
                linkUpdate
            ],cb);

            //link.update(pgClient, linkData,
        });

        it('update word with previous version', function(cb){

            var linkData = {lid : 160000, image : 150000, description: 'ahoj jak sa mas'}

            var length = 0;

            linkGet = function(icb){
                link.get(pgClient, linkData.lid, ['image'], function(err, links){

                    console.log(links);
                    console.log('get');
                    if(links.length > 1){

                        linkData.description = links[1].description;
                        linkData.image = links[1].iid;

                    }
                    length = links.length;
                    icb(null);
                });
            }

            function linkUpdate(icb){
                console.log(linkData);
                link.updateAndGet(pgClient, 3, linkData, ['image'], function(err, links){
                    console.log(links);
                    console.log(err);

                    assert(links.length == length);
                    assert(links[0].iid == linkData.image);
                    assert(links[0].description == linkData.description);
                    assert(links[0].usr == 3);
                    icb(null);
                });
            }

            async.series([
                linkGet,
                linkUpdate
            ],cb);

            //link.update(pgClient, linkData,
        });

        it('update word with previous version', function(cb){

            var linkData = {lid : 160001, image : 150000, description: 'ahoj jak sa mas'}

            var length = 0;

            linkGet = function(icb){
                link.get(pgClient, linkData.lid, ['image'], function(err, links){

                    console.log(links);
                    console.log('get');
                    if(links.length > 0){

                        linkData.description = links[0].description;
                        //linkData.image = links[0].iid;

                    }
                    length = links.length;
                    icb(null);
                });
            }

            function linkUpdate(icb){
                console.log(linkData);
                link.deleteImageAndGet(pgClient, 3, linkData.lid, ['image'], function(err, links){
                    console.log(links);
                    console.log(err);

                    assert(links.length == length+1);
                    assert(links[0].iid == null);
                    assert(links[0].description == linkData.description);
                    assert(links[0].usr == 3);
                    icb(null);
                });
            }

            async.series([
                linkGet,
                linkUpdate
            ],cb);

            //link.update(pgClient, linkData,
        });

    });




})