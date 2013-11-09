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
                "select create_test_data();"
                //, "SELECT generate_langs();"
                //, "SELECT remove_test_data();"


            ],cb);

        });
    });

    after(function(cb){
        sqlMake(pgClient, [
            "SELECT remove_test_data();"
        ],cb);
    });

    afterEach(function(cb){
        sqlMake(pgClient, ["DELETE FROM update_package;"], cb);
    });

    function testGetPackageForUpdate(lesson, cb){
        package.getPackageForUpdate(pgClient, function(err, packages){
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

    describe.only('download and store images', function(){
        it('update word', function(cb){
            sqlMake(pgClient, [
                "SELECT generate_langs();"
            ],function(){
                testGetPackageForUpdate([
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
        it('update word', function(cb){

            sqlMake(pgClient, [
                "update word set word='test1' where link=2002 and lang='de'",
                "update word set word='test1' where link=2002 and lang='en'"
            ],function(){
                testGetPackageForUpdate([
                    { lesson: 4001,
                        lang_mask: '7',
                        langs: [ 'de', 'en' ] }], function(){
                    cb();
                })
            });


        });
    });




})