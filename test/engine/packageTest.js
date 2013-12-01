/*
 mkdir /tmp/ahoj && mkdir /tmp/ahoj/orig && mkdir /tmp/ahoj/thumb && mkdir /tmp/ahoj/pkg && ln -s /tmp/ahoj/orig/ ~/nodejs/voc4u/assets/img/orig && ln -s /tmp/ahoj/thumb/ ~/nodejs/voc4u/assets/img/thumb && ln -s /tmp/ahoj/pkg/ ~/nodejs/voc4u/assets/pkg && cp /tmp/ahoj/orig/* /tmp/ahoj/thumb/

 drop database voc4u_test; create database voc4u_test; alter database voc4u_test owner to uservoc4u;
 psql -U uservoc4u voc4u_test < initdata/init.sql && psql -U uservoc4u voc4u_test < initdata/inittest.sql && psql -U uservoc4u voc4u_test < initdata/update_v1.1.sql

 */

var assert = require("assert"),
    package = require('../../engine/package.js'),
    words = require('../../engine/words.js'),
    pg = require('pg'),
    should = require('should')
    , async = require('async')
    ,config = require('../../config/local.js')
    ,fs = require('fs');

var pgClient = null;

var sqlMake = require('../../lib/helps/helps.js').sqlMake;

var inDir = '/tmp/tes3x/';
var inDirLang = inDir + 'lang/';
var inDirImg = inDir + 'img/';

describe.skip('package operations', function(){

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
                "SELECT remove_test_data();" ,
                "select create_test_data();"
                //, "SELECT generate_langs();"
                //, "SELECT remove_test_data();"


            ],cb);

        });
    });

    after(function(cb){


        sqlMake(pgClient, [
            "SELECT remove_test_data();" ,
            "delete from update_package_t;"
        ],cb);
    });




    describe('test getPackageForUpdate', function(){
        function testGetPackageForUpdate(timeFrom, lesson, cb){

            package.getPackageForUpdate(pgClient, timeFrom, function(err, packages){
                console.log(err || packages);
                packages.should.be.Array;
                packages.length.should.equal(lesson.length);

                packages.forEach(function(package, idx){

                    var test = lesson[idx];
                    package.should.have.property('langs');
                    package.langs.should.be.Array;
                    package.langs.length.should.equal(test.langs.length);
                    package.langs[0].should.be.String;

                    test.langs.forEach(function(lang){
                        package.langs.should.include(lang);
                    });

                    package.should.have.property('lesson');
                    package.lesson.should.be.Integer;
                    package.lesson.should.eql(test.lesson);

                });


                cb();
            });
        }

        it('inital test with generate_langs() which put all to update', function(cb){
            var timeNow = new Date();
            sqlMake(pgClient, [
                "update word set word='ahoj';"
            ],function(){
                testGetPackageForUpdate(timeNow, [
                    { lesson: 101,
                        lang_mask: '7',
                        langs: [ 'de', 'cs', 'en' ] },
                    { lesson: 102,
                        lang_mask: '7',
                        langs: [ 'de', 'cs', 'en' ] },
                    { lesson: 2001,
                        lang_mask: '7',
                        langs: [ 'de', 'cs', 'en' ] },
                    { lesson: 2004,
                        lang_mask: '4',
                        langs: [ 'en', 'cs', 'en' ] },
                    { lesson: 4001,
                        lang_mask: '7',
                        langs: [ 'de', 'cs', 'en' ] }], function(){
                    cb();
                })
            });


        });
        it('just two languages changed', function(cb){
            var timeNow = new Date();
            sqlMake(pgClient, [
                "update word set word='test1' where link=2002 and lang='de'",
                "update word set word='test1' where link=2002 and lang='en'"
            ],function(){
                testGetPackageForUpdate(timeNow, [
                    { lesson: 4001,
                        lang_mask: '7',
                        langs: [ 'de', 'en' ] }], function(){
                    cb();
                })
            });
        });

        it('whole link (all languages) should be changed', function(cb){
            var timeNow = new Date();
            sqlMake(pgClient, [
                "update link set image=1 where lid=2002 and version=0"
            ],function(){
                testGetPackageForUpdate(timeNow, [
                    { lesson: 4001,
                        lang_mask: '7',
                        langs: [ 'de', 'en', 'cs' ] }], function(){
                    cb();
                })
            });
        });

        afterEach(function(cb){
            sqlMake(pgClient, [
                "delete from update_package_t;"
            ],cb);
        });

    });

    describe('download and store images', function(){
        beforeEach(function(cb){
            fs.mkdirSync(inDir);
            fs.mkdirSync(inDirLang);
            fs.mkdirSync(inDirImg);
            cb();
        });

        afterEach(function(cb){
            unlinkDir(inDir);

            function unlinkDir(dir){
                fs.readdirSync(dir).forEach(function(file){
                    var path = dir + file;
                    console.log('delete', path);
                    if(fs.statSync(path).isDirectory()) {
                        unlinkDir(path + '/');
                    } else {
                        fs.unlinkSync(path);
                    }


                }) ;

                fs.rmdirSync(dir);
            }



            sqlMake(pgClient, ["DELETE FROM update_package_t;"], cb);
        });

        it('inital test with generate_langs() which put all to update', function(done){

            var lesson = 102;
            var lang = 'cs';



            words.getWordsWithImages(pgClient, [lang], lesson, function(err, testWords){
            var generateData = {
                    outDir : inDir,
                    lesson : lesson,
                    lang : lang,
                    words : testWords[1],
                    images : testWords[0]
                };
            package.generateLangFile(generateData, function(err){
                assert(!err, err);
                var file = inDirLang + 'cs.data';
                fs.existsSync(file).should.be.eql(true);
                var data = fs.readFileSync(file);
                console.log(data);
                var len = 0;
                data.toString().split('\n').forEach(function(row, idx){
                   if(idx == 0){
                       testRow0(row);
                   } else {
                       if(len < testWords[1].length){
                           testRowN(row, generateData.words[len]);
                       }

                       len += 1;
                   }


                });


                len.should.be.eql(testWords[1].length+1);
                done();
            });
                // first row should be in format:
                // lesson;lang;words_len
                function testRow0(row){
                    var rowParams = row.split(';');
                    rowParams.length.should.eql(3);
                    rowParams[0].should.eql(lesson);
                    rowParams[1].should.eql(lang);
                    rowParams[2].should.eql(testWords[1].length);
                }

                function testRowN(row, w){

                    var rowParams = row.split(';');
                    rowParams.length.should.above(1);
                    rowParams[0].should.eql(w.link);
                    rowParams[1].should.eql(w.word);

                    var foundImage = '';
                    generateData.images.some(function(image){
                        //console.log(image);
                        if(w.link == image.lid){
                            if(image.imagefile){
                                foundImage = image.imagefile;
                            }
                            return true;
                        }

                        return false;
                    });


                    rowParams[2].should.eql(foundImage);


                }

            }); // words.getWords(pgClient, lesson, [lang], function(testWords){

        });

        it('inital test with copy images into test', function(done){

            var lesson = 101;
            var lang = 'cs';



            words.getWordsWithImages(pgClient, [lang], lesson, function(err, testWords){
                var generateData = {
                    outDir : inDir,
                    images : testWords[0]
                };
                package.copyImageFiles(generateData, function(err, data){
                    var lastFile = '';

                    console.log('data', err? err : data);

                    data.should.be.Array;

                    testWords[1].some(function(img, idx){
                        lastFile = 'missing : ' + img.imagefile;
                        if(img.imagefile && !fs.existsSync(generateData.outDir + 'img/' + img.imagefile)){
                            return true;
                        }

                        if(img.imagefile){
                            data.should.contain(img.imagefile);
                            console.log(lastFile);
                        }


                        lastFile = '';
                    })

                    lastFile.should.be.eql('');

                    data.some(function(img, idx){
                        lastFile = 'file in advance : ' + img;

                        if(!fs.existsSync(generateData.outDir +'img/' + img)){
                            return true;
                        }

                        lastFile = '';
                    });

                    // the data list have more files then are real
                    lastFile.should.be.eql('');


                    done();
                });
            }); // words.getWords(pgClient, lesson, [lang], function(testWords){

        });

        it('inital test with copy images into test', function(done){
            var lesson = 101;
            var lang = 'cs';

            var dir = inDir + lesson + '/';

            package.createPkgDirectory(dir, function(err){
                fs.statSync(dir).isDirectory().should.eql(true);
                fs.statSync(dir + 'lang/').isDirectory().should.eql(true);
                fs.statSync(dir + 'img/').isDirectory().should.eql(true);
            });

            done();

        });

        it.skip('inital test with copy images into test', function(done){
            var lesson = 101;
            var lang = 'cs';

            var dir = inDir + lesson + '_' + new Date().getTime() + '/';

            package.createLangFiles(dir, function(err){
                fs.statSync(dir).isDirectory().should.eql(true);
                fs.statSync(dir + 'lang/').isDirectory().should.eql(true);
                fs.statSync(dir + 'img/').isDirectory().should.eql(true);
            });

            done();

        });
    });

    describe('create package', function(){

        before(function(cb){

            if(fs.existsSync(config.DIR_DATA + package.DIR_PKG)){

            } else {
                fs.mkdirSync(config.DIR_PKG+ package.DIR_PKG )
            }
            cb();
        });



        afterEach(function(cb){
            unlinkDir(config.DIR_DATA + package.DIR_PKG);

            function unlinkDir(dir){
                fs.readdirSync(dir).forEach(function(file){
                    var path = dir + file;
                    console.log('delete', path);
                    if(fs.statSync(path).isDirectory()) {
                        unlinkDir(path + '/');
                    } else {
                        fs.unlinkSync(path);
                    }


                }) ;

                //fs.rmdirSync(dir);
            }



            sqlMake(pgClient, ["DELETE FROM update_package_t;"
            , "DELETE FROM package_t;"], cb);
        });

        it('simple package cs 2001', function(cb){
            package.createPackage(pgClient, 101, function(err, pkgFile){
                assert(pkgFile);
                pkgFile.should.be.String;
                fs.existsSync(pkgFile).should.be.eql(true);
                pgClient.query('SELECT * FROM package_t WHERE lesson = $1 AND lang = $2', [101, 'cs'], function(err, data){
                    data.rows.length.should.be.above(0);
                    cb();
                });
            });
        });

        it('update package cs 2001', function(cb){
            var now = new Date().getTime();
            package.updatePackage(pgClient, 101, ['cs'], function(err, pkgFile){

                assert(pkgFile);
                pkgFile.should.be.String;
                fs.existsSync(pkgFile).should.be.eql(true);
                pgClient.query('SELECT * FROM package_t WHERE lesson = $1 AND lang = $2', [101, 'cs'], function(err, data){
                    data.rows.length.should.be.eql(1);
                    var row0 = data.rows[0];
                    var changedDate = new Date(row0.changed).getTime();

                    changedDate.should.be.above(now);
                    cb();
                });
            });
        });


    });

    describe('update_packages_t', function(){
        it('remove', function(cb){
            sqlMake(pgClient, ["UPDATE word SET word='ahoj1' WHERE lang='cs' AND link = 2001"],
                function (icb){
                    package.removeUpdatePackage(pgClient, 4001, function(err, pkgFile){
                        pgClient.query('DELETE FROM update_package_t', function(err, data){
                            console.log(err, data);
                            data.rowCount.should.be.eql(0);
                            cb();
                        });

                    });
                });
        });


    });


})