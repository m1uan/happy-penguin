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

var inDir = '/tmp/3test021/';
var inDirLang = inDir + 'lang/';
var inDirImg = inDir + 'img/';

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
                "-- select create_test_data();"
                //, "SELECT generate_langs();"
                //, "SELECT remove_test_data();"


            ],cb);

        });
    });

    after(function(cb){


        sqlMake(pgClient, [
            "--SELECT remove_test_data();"
        ],cb);
    });


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

    describe('test getPackageForUpdate', function(){
        it('inital test with generate_langs() which put all to update', function(cb){
            var timeNow = new Date();
            sqlMake(pgClient, [
                "SELECT generate_langs();"
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
    });

    describe.only('download and store images', function(){
        beforeEach(function(cb){
            fs.mkdirSync(inDir);
            fs.mkdirSync(inDirLang);
            fs.mkdirSync(inDirImg);
            cb();
        });

        afterEach(function(cb){
            fs.readdirSync(inDirLang).forEach(function(file){
                fs.unlinkSync(inDirLang + file);
            }) ;

            fs.readdirSync(inDirImg).forEach(function(file){
                fs.unlinkSync(inDirImg + file);
            }) ;

            fs.rmdirSync(inDirLang);
            fs.rmdirSync(inDirImg);
            fs.rmdirSync(inDir);

            sqlMake(pgClient, ["DELETE FROM update_package;"], cb);
        });

        it('inital test with generate_langs() which put all to update', function(done){

            var lesson = 102;
            var lang = 'cs';



            words.getWordsWithImages(pgClient, [lang], lesson, function(err, testWords){
            var generateData = {
                    outDir : inDirLang,
                    lesson : lesson,
                    lang : lang,
                    words : testWords[0],
                    images : testWords[1]
                };
            package.generateLangFile(generateData, function(err){
                assert(!err);
                var file = inDirLang + 'cs.data';
                fs.existsSync(file).should.be.eql(true);
                var data = fs.readFileSync(file);
                console.log(data);
                var len = 0;
                data.toString().split('\n').forEach(function(row, idx){
                   if(idx == 0){
                       testRow0(row);
                   } else {
                       if(len < testWords[0].length){
                           testRowN(row, generateData.words[len]);
                       }

                       len += 1;
                   }


                });


                len.should.be.eql(testWords[0].length+1);
                done();
            });
                // first row should be in format:
                // lesson;lang;words_len
                function testRow0(row){
                    var rowParams = row.split(';');
                    rowParams.length.should.eql(3);
                    rowParams[0].should.eql(lesson);
                    rowParams[1].should.eql(lang);
                    rowParams[2].should.eql(testWords[0].length);
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
    });


})