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
describe.only('translates', function(){

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
                "DELETE FROM pinguin.image_t;",
                "DELETE FROM pinguin.question_t;",
                "DELETE FROM pinguin.place_t;",
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



    });
        describe('trans', function(){
        it.only('addtranslate - with key', function(cb){

            var dataContainer = {
                lang :  'en',
                key : '_hello88',
                desc: 'Hello\''
            };

            translates.addtranslate(pgClient, dataContainer, function(err,trans){
                if(err) err.should.be.null;
                pgClient.query('SELECT * FROM translates.translate_t as tt JOIN translates.link_t as tl ON tt.link=tl.link WHERE lang=$1 AND tt.link=$2', [dataContainer.lang,trans.link], function(err, data){
                    data.should.be.ok;
                    data.should.have.property('rows');
                    data.rows.should.be.a.array;
                    data.rows.length.should.equal(1);

                    var row = data.rows[0];
                    row.key.should.be.equal(dataContainer.key);
                    row.desc.should.be.equal(dataContainer.desc);
                    row.data.should.be.equal(dataContainer.desc);
                    cb();
                });
            });
        });

            it('addtranslate - whitout key', function(cb){

                var dataContainer = {
                    lang :  'en',
                    desc: 'Hel\'lo'
                };

                translates.addtranslate(pgClient, dataContainer, function(err,trans){

                    if(err) err.should.be.null;
                    pgClient.query('SELECT * FROM translates.translate_t as tt JOIN translates.link_t as tl ON tt.link=tl.link WHERE lang=$1 AND tt.link=$2', [dataContainer.lang,trans.link], function(err, data){
                        data.should.be.ok;
                        data.should.have.property('rows');
                        data.rows.should.be.a.array;
                        data.rows.length.should.equal(1);

                        var row = data.rows[0];
                        row.desc.should.be.equal(dataContainer.desc);
                        row.data.should.be.equal(dataContainer.desc);
                        if(row.key)row.key.should.be.null;
                        cb();
                    });
                });
            });

            it('delete', function(cb){

                var dataContainer = {
                    lang :  'en',
                    desc: 'Hello'
                };

                translates.addtranslate(pgClient, dataContainer, function(err,trans){
                    translates.delete(pgClient, trans, function(err2, del){
                        if(err) err.should.be.null;
                        pgClient.query('SELECT * FROM translates.translate_t WHERE lang=$1 AND link=$2', [dataContainer.lang,trans.link], function(err, data){
                            data.should.be.ok;
                            data.should.have.property('rows');
                            data.rows.should.be.a.array;
                            data.rows.length.should.equal(0);
                            cb();
                        });
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


            it('updatedesc - with group', function(cb){

                var dataContainer = {
                    lang :  'en',
                    key : '_hello38',
                    desc: 'Hello38',
                    group: 5
                };

                translates.addtranslate(pgClient, dataContainer, function(translate,data){
                    var dataContainer2 = {
                        link : data.link,
                        key : '_hello48',
                        desc: 'Hello48',
                        group: 7
                    };

                    data.should.have.property('group');
                    data.group.should.be.equal(5);
                    translates.updatedesc(pgClient, dataContainer2, function(err2,data2){
                        data2.should.be.ok;
                        data2.should.be.a.array;
                        data2.length.should.be.equal(1);

                        var row = data2[0];

                        row.should.have.property('group');
                        row.group.should.be.equal(7);
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

            it('gettranslate group 8', function(cb){

                var dataContainerGet = {
                    lang :  'cz',
                    page : 0,
                    second: 'en',
                    group: 8
                };
                var dataContainerAdd = {
                    lang :  'en',
                    key : '_hello52',
                    desc: 'Hello52',
                    group : 8
                };

                translates.addtranslate(pgClient, dataContainerAdd, function(translate1,data1){
                    translates.get(pgClient, ['link','group'], dataContainerGet, function(translate,data){
                        data.should.be.ok;
                        data.should.be.a.array;
                        data.length.should.be.above(0);

                        var find = false;
                        data.forEach(function(trans){
                            trans.should.have.property('group');
                            if(trans.link == data1.link){
                                find = true;
                            }

                            // between selection with group 8 should be nothing else than 8
                            trans.group.should.be.equal(dataContainerGet.group);
                        });

                        find.should.be.ok;

                        cb();
                    });
                });
            });

    });
    describe('request', function(){

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

        it('import/export', function(cb){
            //var ser = new server();
            var MILAN = '***milan***';
            function gcsv(req, lang, icb){
                req.get('/admin/translates/get/'+lang+'/?type=csv')
                    .set('Content-Encoding', /json/)
                    .expect(200)
                    .expect('Content-Type', /plain/)
                    .end(function(err, res){

                        if (err) {
                            throw err;

                        }

                        icb(res)});
            }

            function pin(req, data, icb){
                req.post('/admin/translates/import/tt/?type=csv')
                    //.expect('Content-Type', /json/)
                    //.expect('Content-Length', '20')
                    .set('Content-Encoding', /text/)
                    .expect(200)
                    .send({csv:data})
                    .expect('Content-Type', /json/)
                    .end(function(err, res){

                        if (err) {
                            throw err;

                        }

                        icb(res)});
            };

            // works for local host - but is not connect to test DB
            var req = request.agent('http://localhost:8080');
            //var req = request.agent(server);
            req
                .post('/login/')
                .send({ username: 'milan', password: 'milan' })
                .end(function(err, resLog) {

                    // get data from english version
                    gcsv(req, 'en', function(res){
                        var ORIGIN = res.text;
                        var lines = res.text.split('\n');
                        var out = '';

                        lines.some(function(line,idx){
                            if(line && line.indexOf(MILAN) < 0){
                                out+=line + MILAN + '\n';
                            }

                        });

                        // put data to tt -test language version
                        pin(req, out, function(res){
                            // test if stored
                            gcsv(req, 'tt', function(res2){
                                // TEST contain milan ;-)
                                var lines2 = res2.text.split('\n');
                                lines2.some(function(line,idx){
                                    if(line && line.indexOf(MILAN) < 0){
                                        throw MILAN + ' -- missing on idx:' + idx;
                                    }

                                });

                                // back to origin
                                pin(req, ORIGIN, function(){cb()});
                            });
                        });
                    });
                });
        });
});


});