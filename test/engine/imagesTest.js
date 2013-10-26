var assert = require("assert"),
    images = require('../../engine/image.js'),
    pg = require('pg'),
    should = require('should')
    , async = require('async')
    ,config = require('../../config/local.js');

var dboxClient = null;
var sqlMake = require('../../lib/helps/helps.js').sqlMake;

var imageForDelete = [];

// switch off imagemagick with configuration
//  npm --version 1.3.11
// node --version v0.10.20
// cat /etc/*-release
// DISTRIB_ID=Ubuntu
// DISTRIB_RELEASE=12.10
// DISTRIB_CODENAME=quantal
// DISTRIB_DESCRIPTION="Ubuntu 12.10"
// NAME="Ubuntu"
// VERSION="12.10, Quantal Quetzal"
// ID=ubuntu
// ID_LIKE=debian
// PRETTY_NAME="Ubuntu quantal (12.10)"
// VERSION_ID="12.10"

// uname -a
// gLinux m1uan 3.5.0-41-generic #64-Ubuntu SMP Wed Sep 11 15:40:48 UTC 2013 i686 i686 i686 GNU/Linux

// npm --version 1.3.11
// node --version v0.10.20

/* DISTRIB_ID=Ubuntu
 DISTRIB_RELEASE=13.04
 DISTRIB_CODENAME=raring
 DISTRIB_DESCRIPTION="Ubuntu 13.04"
 NAME="Ubuntu"
 VERSION="13.04, Raring Ringtail"
 ID=ubuntu
 ID_LIKE=debian
 PRETTY_NAME="Ubuntu 13.04"
 VERSION_ID="13.04"
 HOME_URL="http://www.ubuntu.com/"
 SUPPORT_URL="http://help.ubuntu.com/"
 BUG_REPORT_URL="http://bugs.launchpad.net/ubuntu/
 */

// linux pilsner.wlg.morphoss.com 3.8.0-19-generic #29-Ubuntu SMP Wed Apr 17 18:16:28 UTC 2013 x86_64 x86_64 x86_64 GNU/Linux







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
                "INSERT INTO link (lid,description,lesson) VALUES (160002,'descrpsdf sad fdas f',1);"
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


    describe('test engine of image', function(){
        it('test imagemagick', function(cb){
            if(typeof config.imagemagick !== 'undefined' || !config.imagemagick){
                cb();
                return;
            }
            var im = require('imagemagick');
            im.identify('/home/miuan/nodejs/voc4u/undefined113923-9245-d2di5n.jpg', function(err, metadata){
                cb();
            });
        });
        it('link is not image', function(cb){
            var imgfile = 'http://0.tqn.com/d/motorcycles/1/0/f/o/-/-/Dyna_Wide_Glide_flames_static_TR.jpg3';
            // withou magick no change recogineze if real image
            if(typeof config.imagemagick === 'undefined' || config.imagemagick){
                images.saveFromUrl(pgClient, 1, 160002, imgfile, function(err, rows){
                    assert(err);
                    cb();
                });
            } else {
                cb();
            }
        });

        it.skip('wrong url', function(cb){
            var imgfile = 'http://www.sejkonopi.com/novoklik1.jpg';

            images.saveFromUrl(pgClient, 1, 160002, imgfile, function(err, rows){
                assert(err);
                cb();
            });
        });

        it('upload image', function(cb){
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

        it('uploat two same image', function(cb){
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