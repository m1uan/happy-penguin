var assert = require("assert"),
    SL = require('../../lib/happy/sqllib.js'),
    translates = require('../../engine/translates/langs.js'),
    pg = require('pg'),
    should = require('should')
    , Async = require('async')
    ,config = require('../../config/local.js')
    ,fs = require('fs')
    ,request = require('supertest');

var pgClient = null;

var sqlMake = require('../../lib/helps/helps.js').sqlMake;

var inDir = '/tmp/tes3x/';
var inDirLang = inDir + 'lang/';
var inDirImg = inDir + 'img/';
describe('translates', function(){

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
                "UPDATE translates.lang_t SET link=NULL;",
                "DELETE FROM translates.translate_t;",
                "DELETE FROM translates.link_t;",
                "DELETE FROM translates.lang_t;"

                //, "SELECT generate_langs();"
                //, "SELECT remove_test_data();"


            ],cb);


        });
    });

    after(function(cb){

//        sqlMake(pgClient, [
//            "SELECT remove_test_data();"
//
//        ],cb);
        pgClient.close();
        cb();
    });


    describe('langs', function(){
        it('addlang - simple', function(cb){

            var dataContainer = {
                lang :  'en',
                name : 'English'
            };

            translates.addlang(pgClient, dataContainer, function(err){
                pgClient.query('SELECT * FROM translates.lang_t WHERE lang=$1', [dataContainer.lang], function(err, data){
                    data.should.be.ok;
                    data.should.have.property('rows');
                    data.rows.should.be.a.array;
                    data.rows.length.should.equal(1);

                    cb();
                });
            });



        });

        it('addlang - with translate', function(cb){

            var dataContainer = {
                lang :  'cz',
                name : 'Czech',
                lang_of_name: 'en'
            };

            translates.addlang(pgClient, dataContainer, function(err){
                pgClient.query('SELECT * FROM translates.lang_t WHERE lang=$1', [dataContainer.lang], function(err, data){
                    data.should.be.ok;
                    data.should.have.property('rows');
                    data.rows.should.be.a.array;
                    data.rows.length.should.equal(1);

                    cb();
                });
            });
        });



        it('getlangs', function(cb){

            var dataContainer = {
                lang_of_names :  'en'
            };

            translates.getlangs(pgClient, ['lang','name','translate'], dataContainer, function(translate,data){
                data.should.be.a.array;
                data.length.should.above(1);
                var first = data[0];
                first.should.have.property('lang');
                first.should.have.property('name');
                first.should.have.property('translate');
                cb();
            });
        });


        it('addtranslate', function(cb){

            var dataContainer = {
                lang :  'en',
                key : '_hello',
                desc: 'Hello'
            };

            translates.addtranslate(pgClient, dataContainer, function(translate,data){

                pgClient.query('SELECT * FROM translates.lang_t WHERE lang=$1', [dataContainer.lang], function(err, data){
                    data.should.be.ok;
                    data.should.have.property('rows');
                    data.rows.should.be.a.array;
                    data.rows.length.should.equal(1);
                    cb();
                });
            });
        });

        it('updatedesc', function(cb){

            var dataContainer = {
                lang :  'en',
                key : '_hello18',
                desc: 'Hello18'
            };

            translates.addtranslate(pgClient, dataContainer, function(translate,data){
                var dataContainer2 = {
                    link : data.link,
                    key : '_hello28',
                    desc: 'Hello28'
                };

                translates.updatedesc(pgClient, dataContainer2, function(err2,data2){
                    data2.should.be.ok;
                    data2.should.be.a.array;
                    data2.length.should.be.equal(1);

                    var row = data2[0];
                    row.should.have.property('desc');
                    row.should.have.property('key');
                    row.desc.should.be.equal(dataContainer2.desc);
                    row.key.should.be.equal(dataContainer2.key);
                        cb();
                });
            });
        });


        it('gettranslate page 0', function(cb){

            var dataContainer = {
                lang :  'en',
                page : 0,
                lastUpdateFirst: true
            };
            var dataContainer1 = {
                lang :  'en',
                key : '_hello11',
                desc: 'Hello11'
            };

            translates.addtranslate(pgClient, dataContainer1, function(translate1,data1){
                translates.get(pgClient, ['link','data','desc','key'], dataContainer, function(translate,data){
                    data.should.be.ok;
                    data.should.be.a.array;
                    data.length.should.be.above(0);

                    var find = false;

                    data.forEach(function(trans){
                        trans.should.have.property('desc');
                        trans.should.have.property('key');
                        trans.should.have.property('data')
                        if(trans.desc == dataContainer1.desc){
                            find = true;
                        }
                    });

                    find.should.be.ok;

                    cb();
                });
            });
        });


        it('gettranslate second lang en', function(cb){

            var dataContainerGet = {
                lang :  'cz',
                page : 0,
                second: 'en'
            };
            var dataContainerAdd = {
                lang :  'en',
                key : '_hello12',
                desc: 'Hello12'
            };

            translates.addtranslate(pgClient, dataContainerAdd, function(translate1,data1){
                translates.get(pgClient, ['link','data','desc','key'], dataContainerGet, function(translate,data){
                    data.should.be.ok;
                    data.should.be.a.array;
                    data.length.should.be.above(0);

                    var find = false;

                    data.forEach(function(trans){
                        trans.should.have.property('desc');
                        trans.should.have.property('key');
                        trans.should.have.property('data')
                        if(trans.data == dataContainerAdd.desc){
                            find = true;
                        }
                    });

                    find.should.be.ok;

                    cb();
                });
            });
        });

    });
    describe.only('request', function(){

    it('get - json', function(cb){
        //var ser = new server();


        var req =  request('http://localhost:8080');

        req.get('/admin/translates/get/cz/en/?type=angular-static')
            //.expect('Content-Type', /json/)
            //.expect('Content-Length', '20')
            .set('Content-Encoding', /json/)
            .expect(200)
        .expect('Content-Type', /json/)
            .end(function(err, res){
                console.log(res);
                if (err) {

                    throw err;

                }

                res.body.should.be.ok;
                res.body.should.have.a.property('_english');
                res.body.should.have.a.property('_czech');
                res.body._english.should.be.not.null;

                cb();
            });
    });
});


})