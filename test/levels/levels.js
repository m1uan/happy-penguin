var assert = require("assert"),
    SL = require('../../lib/happy/sqllib.js'),
    levels = require('../../engine/levels/levels.js'),
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
describe.only('levels', function(){

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

                "DELETE FROM pinguin.question_t;",
                "DELETE FROM pinguin.place_t;",
                "DELETE FROM translates.translate_t USING translates.link_t WHERE translates.link_t.group = 1000 AND translates.translate_t.link = translates.link_t.link;",
                "DELETE FROM translates.link_t WHERE translates.link_t.group = 1000;"
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

    describe('place', function(){

        it('create', function(cb){
            var dataContainer = {
                name : 'place',
                posx: 0.5,
                posy: 0.5
            };


            levels.create(pgClient,dataContainer, function(err, data){
                assert(!err);

                data.should.have.property('id');
                data.should.have.property('name');
                data.should.have.property('posx');
                data.should.have.property('posy');
                data.posx.should.be.equal(dataContainer.posx);
                data.posy.should.be.equal(dataContainer.posy);
                data.name.should.be.equal(dataContainer.name);
                cb();
            });




        });


        it('updatepos', function(cb){
            var dataContainerCreate = {
                name : 'place_1',
                posx: 0.15,
                posy: 0.15
            };


            // create for update
            levels.create(pgClient, dataContainerCreate, function(err, crated){

                var dataContainer = {
                    id : crated.id,
                    name : 'place_5',
                    posx: 0.5,
                    posy: 0.5,
                    info: 'this is the most beautifully place'
                };


                levels.updatepos(pgClient,dataContainer, function(err, updated){
                    assert(!err);

                    updated.should.have.property('posx');
                    updated.should.have.property('posy');
                    updated.posx.should.be.equal(dataContainer.posx);
                    updated.posy.should.be.equal(dataContainer.posy);
                    cb();
                });

            });


        });

        it('updatename and update info', function(cb){
            var dataContainerCreate = {
                name : 'place_2',
                posx: 0.15,
                posy: 0.15
            };


            // create for update
            levels.create(pgClient, dataContainerCreate, function(err, crated){

                var dataContainer = {
                    id : crated.id,
                    name : 'place_5',
                    info : 'krasne misto'
                };

                levels.updatename(pgClient,dataContainer, function(err, updated){
                    assert(!err);

                    updated.should.have.property('name');
                    updated.name.should.be.equal(dataContainer.name);

                    levels.updateinfo(pgClient,dataContainer, function(err2, updated2){
                        assert(!err2);

                        updated2.should.have.property('info');
                        updated2.info.should.be.equal(dataContainer.info);
                        cb();
                    });
                });

            });
        });

        it('get', function(cb){
            var dataContainerCreate = {
                name : 'wonderful_place',
                posx: 0.15,
                posy: 0.15,
                info: 'Place with 20 inhabitans'

            };


            // create for update
            createPlace(pgClient, dataContainerCreate, function(err, created){

                var dataContainer = {
                    id: created[0].id,
                    fields : ['id','name','posx','posy','info'],
                    lang : 'en'
                }


                levels.get(pgClient, dataContainer, function(err, getData){
                    should.not.exist(err);
                    should.exist(getData);
                    getData.should.have.property('id');
                    getData.should.have.property('name');
                    getData.should.have.property('posx');
                    getData.should.have.property('posy');
                    getData.should.have.property('info');
                    getData.posx.should.be.approximately(dataContainerCreate.posx, 0.01);
                    getData.posy.should.be.approximately(dataContainerCreate.posy, 0.01);
                    getData.info.should.be.equal(dataContainerCreate.info);
                    getData.name.should.be.equal(dataContainerCreate.name);
                    getData.id.should.be.equal(created[0].id);
                    cb();
                })

            });


        });

        it('get - with questions', function(cb){
            var dataContainerCreate = {
                name : 'wonderful_place 2',
                posx: 0.15,
                posy: 0.15,
                info: 'Place with 20 inhabitans',
                question : 'How many inhabitans living here?',
                answers: 'in this city living 20 inhabitans.',
                question2 : '2How many inhabitans living here?',
                answers2: '2in this city living 20 inhabitans.',
                question3 : '3How many inhabitans living here?',
                answers3: '3in this city living 20 inhabitans.'

            };


            // create for update
            createPlace(pgClient, dataContainerCreate, function(err, created){

                var dataContainer = {
                    id: created[0].id,
                    fields : ['id','name','posx','posy','info'],
                    qfields : ['question','answers'],
                    qlang : 'en',
                    lang : 'en'
                }


                levels.get(pgClient, dataContainer, function(err, getData){
                    should.not.exist(err);
                    should.exist(getData);
                    getData.should.have.property('id');
                    getData.should.have.property('name');
                    getData.should.have.property('posx');
                    getData.should.have.property('posy');
                    getData.should.have.property('info');
                    getData.posx.should.be.approximately(dataContainerCreate.posx, 0.01);
                    getData.posy.should.be.approximately(dataContainerCreate.posy, 0.01);
                    getData.info.should.be.equal(dataContainerCreate.info);
                    getData.name.should.be.equal(dataContainerCreate.name);
                    getData.id.should.be.equal(created[0].id);

                    getData.should.have.property('questions');
                    getData.questions.length.should.be.equal(3);
                    cb();
                })

            });


        });
    });
    describe('question', function(){

        it('add', function(cb){
            var dataContainerCreate = {
                name : 'place_150',
                posx: 0.15,
                posy: 0.15
            };


            // create for update
            levels.create(pgClient, dataContainerCreate, function(err, crated){

                var dataContainer = {
                    place_id : crated.id,
                    question : 'How many inhabitans living here?',
                    answers: 'in this city living 20 inhabitans.'
                }
                levels.qadd(pgClient, dataContainer, function(err, question){
                    if(err)err.should.be.null;
                    question.should.have.property('place_id');
                    question.should.have.property('qid');
                    question.should.have.property('question');
                    question.should.have.property('answers');
                    question.place_id.should.have.be.equal(dataContainer.place_id);
                    question.question.should.have.be.equal(dataContainer.question);
                    question.answers.should.have.be.equal(dataContainer.answers);
                    cb();
                })

            });

        })

        it('update', function(cb){
            var dataContainerCreate = {
                name : 'place_151',
                posx: 0.15,
                posy: 0.15,
                question : 'How many inhabitans living here?',
                answers: 'in this city living 20 inhabitans.'
            };


            // create for update
            createPlace(pgClient, dataContainerCreate, function(err, created){

                var dataContainer = {
                    qid: created[1].qid,
                    question : '2 How many inhabitans living here?',
                    answers: '2 in this city living 20 inhabitans.'
                }
                levels.qupdate(pgClient, dataContainer, function(err, question){
                    if(err)err.should.be.null;

                    question.should.have.property('qid');
                    question.should.have.property('question');
                    question.should.have.property('answers');
                    question.qid.should.have.be.equal(dataContainer.qid);
                    question.question.should.have.be.equal(dataContainer.question);
                    question.answers.should.have.be.equal(dataContainer.answers);
                    cb();
                })

            });

        })



        it('delete - by qid', function(cb){
            var dataContainerCreate = {
                name : 'place_152',
                posx: 0.15,
                posy: 0.15,
                question : 'How many inhabitans living here?',
                answers: 'in this city living 20 inhabitans.',
                question2 : '2How many inhabitans living here?',
                answers2: '2in this city living 20 inhabitans.'
            };


            // create for update
            createPlace(pgClient, dataContainerCreate, function(err, created){

                var dataContainer = {
                    qid: created[1].qid,
                    place_id: created[0].id
                }

                levels.qdelete(pgClient, dataContainer, function(err, question){
                    if(err)err.should.be.null;

                    question.should.be.array;
                    question.length.should.be.equal(1);
                    question[0].should.have.be.equal(dataContainer.qid);
                    cb();
                })

            });

        })


        it('delete - all', function(cb){
            var dataContainerCreate = {
                name : 'place_153',
                posx: 0.15,
                posy: 0.15,
                question : 'How many inhabitans living here?',
                answers: 'in this city living 20 inhabitans.',
                question2 : '2How many inhabitans living here?',
                answers2: '2in this city living 20 inhabitans.'
            };


            // create for update
            createPlace(pgClient, dataContainerCreate, function(err, created){

                var dataContainer = {
                    place_id: created[0].id
                }

                levels.qdelete(pgClient, dataContainer, function(err, question){
                    should.not.exist(err);
                    should.exist(question);

                    question.should.be.array;
                    question.length.should.be.equal(2);
                    question.should.containEql(created[1].qid);
                    question.should.containEql(created[2].qid);
                    cb();
                })

            });

        })

        it('get', function(cb){
            var dataContainerCreate = {
                name : 'place_154',
                posx: 0.15,
                posy: 0.15,
                question : 'How many inhabitans living here?',
                answers: 'in this city living 20 inhabitans.',
                question2 : '2How many inhabitans living here?',
                answers2: '2in this city living 20 inhabitans.'
            };


            // create for update
            createPlace(pgClient, dataContainerCreate, function(err, created){

                var dataContainer = {
                    place_id: created[0].id,
                    fields : ['qid','place_id','question','answers'],
                    qlang:'en',
                    alang:'en'
                }

                levels.qget(pgClient, dataContainer, function(err, question){
                    should.not.exist(err);
                    should.exist(question);

                    question.should.be.array;
                    question.length.should.be.equal(2);
                    question.forEach(function(q,idx){
                        q.should.have.property('qid');
                        q.should.have.property('place_id');
                        q.answers.should.be.equal(created[idx+1].answers);
                        q.question.should.be.equal(created[idx+1].question);
                    })
                    //question.should.containEql(created[1].qid);
                    //question.should.containEql(created[2].qid);
                    cb();
                })

            });

        })

    });

});


function createPlace(pg, dataContainer, cb){
    var watter = [];
    var parallel = [];

    watter.push(function(icb){
        levels.create(pg, dataContainer, icb);
    });

    watter.push(function(created, icb){
        dataContainer.id = created.id;

        // add data container to first
        parallel.push(function(icb){
            icb(null, created);
        });

        if(dataContainer.question){
            parallel.push(function(icb){
                dataContainer.place_id = created.id;
                levels.qadd(pgClient, dataContainer, icb);
            })
        }

        if(dataContainer.question2){
            parallel.push(function(icb){
                var question2Container = {
                    place_id : created.id,
                    question : dataContainer.question2,
                    answers : dataContainer.answers2
                };

                levels.qadd(pgClient, question2Container, icb);
            })
        }


        if(dataContainer.question3){
            parallel.push(function(icb){
                var question3Container = {
                    place_id : created.id,
                    question : dataContainer.question3,
                    answers : dataContainer.answers3
                };

                levels.qadd(pgClient, question3Container, icb);
            })
        }

        if(dataContainer.info){
            parallel.push(function(icb){
                levels.updateinfo(pgClient, dataContainer, icb);
            })
        }

        Async.parallel(parallel, icb);
    });

    Async.waterfall(watter, cb);

}