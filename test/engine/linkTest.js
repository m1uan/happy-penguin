var assert = require("assert"),
    link = require('../../engine/link.js'),
    pg = require('pg'),
    should = require('should')
    , async = require('async')
    ,config = require('../../config/local.js');

var pgClient = null;

var sqlMake = require('../../lib/helps/helps.js').sqlMake;




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

            sqlMake(pgClient, [
                "INSERT INTO image (iid,image,md5) VALUES (150000,'karel.jpg', 'karel');"
                ,"INSERT INTO image (iid,image,md5) VALUES (150001,'karel2.jpg', 'karel2');"
                ,"INSERT INTO link (lid,description,lesson) VALUES (160000,'descrpsdf sad fdas f',1);"
                ,"INSERT INTO link (lid,description,image,lesson) VALUES (160001,'descrpsdf sad fdsafa ', 150000,1);"
                ,"INSERT INTO link (lid,description,image,lesson) VALUES (160002,'descrpsdf sad fdsafa ', 150000,1);"
                ,"INSERT INTO link (lid,description,image,lesson,del) VALUES (160003,'descrpsdf sad fdsafa ', 150000,1,4);"
            ],cb);

        });
    });

    after(function(cb){
        sqlMake(pgClient, [
            "DELETE FROM image WHERE iid = 150000;"
            ,"DELETE FROM image WHERE iid = 150001;"
            ,"DELETE FROM link WHERE lid= 160000;"
            ,"DELETE FROM link WHERE lid= 160001;DELETE FROM link WHERE lid= 160002;DELETE FROM link WHERE lid= 160003;"
        ],cb);
    });


    describe('download and store images', function(){
        it('update word', function(cb){

            var linkData = {lid : 160000, imageId : 150000, description: 'ahoj jak sa mas'}

            var length = 0;

            linkGet = function(icb){
                link.get(pgClient, linkData.lid, ['image'], function(err, links){

                    console.log('links update 1', links);

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
                    console.log('links update 2', err || links);
                    links.should.a.length(length + 1);
                    links[0].should.have.property('imageid');
                    links[0].imageid.should.eql(linkData.imageId);
                    assert(links[0].description == linkData.description);
                    assert(links[0].usr == 2);
                    links[0].should.have.property('thumbfile');
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

                    console.log('links update 3', err || links);
                    links[1].should.have.property('thumbfile');
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
                link.updateAndGet(pgClient, 3, linkData, ['image'], function(err, links2){
                    console.log('links update 4', err || links2, length);

                    assert(links2.length == length);
                    assert(links2[0].iid == linkData.imageId);
                    assert(links2[0].description == linkData.description);
                    assert(links2[0].usr == 3);
                    icb(null);
                });
            }



            async.series([
                linkGet,
                linkUpdate
            ],cb);

            //link.update(pgClient, linkData,
        });

        it('DELETE !!! update word with previous version', function(cb){

            var linkData = {lid : 160001, image : 150000, description: 'ahoj jak sa mas'}

            var length = 0;

            linkGet = function(icb){
                link.get(pgClient, linkData.lid, ['image'], function(err, links){

                    console.log('update 1', err || links );
                    if(links.length > 0){

                        linkData.description = links[0].description;
                        //linkData.image = links[0].iid;

                    }
                    length = links.length;
                    icb(null);
                });
            }

            function linkUpdate(icb){

                console.log('linkData', linkData);
                link.deleteImageAndGet(pgClient, 3, linkData.lid, ['image'], function(err, links){
                    console.log('delete 2', err || links );

                    assert(links.length == length+1);
                    assert(links[0].iid == null);
                    assert(links[0].description == linkData.description);
                    assert(links[0].usr == 3);
                    icb(null);
                });
            }

            function linkUpdate2(icb){

                console.log('linkData', linkData);
                link.deleteImageAndGet(pgClient, 3, linkData.lid, ['image'], function(err, links){
                link.deleteImageAndGet(pgClient, 3, linkData.lid, ['image'], function(err, links){
                    console.log('delete 3', err || links );

                    assert(links.length == length+1);
                    assert(links[0].iid == null);
                    assert(links[0].description == linkData.description);
                    assert(links[0].usr == 3);
                    icb(null);
                });
                });
            }

            async.series([
                linkGet,
                linkUpdate,
                linkUpdate2
            ],cb);

            //link.update(pgClient, linkData,
        });

    });

    describe('delete link', function(){
        it('should return several rows', function(cb){
            link.deleteLink(pgClient, [160002, 160003], function(err, rows){
                console.log(rows);
                rows.should.be.Array;
                rows.length.should.be.eql(2);
                var row0 = rows[0];
                row0.should.be.a.Object;
                row0.should.have.property('lid');
                row0.should.have.property('del');
                row0.lid.should.be.eql(160002);
                row0.del.should.be.eql(1);

                var row1 = rows[1];
                row1.should.be.a.Object;
                row1.should.have.property('lid');
                row1.should.have.property('del');
                row1.lid.should.be.eql(160003);
                row1.del.should.be.eql(5);
                cb();
            })

        })
    });




})