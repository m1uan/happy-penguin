var assert = require("assert"),
    SL = require('../../lib/happy/sqllib.js'),
    levels = require('../../engine/levels/levels.js'),
    pg = require('pg'),
    should = require('should')
    , Async = require('async')
    ,config = require('../../config/local.js')
    ,fs = require('fs')
    ,request = require('supertest')
    ,images = require('../../engine/image.js');

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
                "UPDATE pinguin.place_t SET preview_iid = null;",
                "DELETE FROM pinguin.image_t;",
                "DELETE FROM pinguin.question_t;",
                "DELETE FROM pinguin.place_t;",
                "DELETE FROM translates.translate_t USING translates.link_t WHERE translates.link_t.group = 1000 AND translates.translate_t.link = translates.link_t.link;",
                "DELETE FROM translates.link_t WHERE translates.link_t.group = 1000;",
                "DELETE FROM translates.translate_t WHERE lang='f1';",
                "DELETE FROM translates.lang_t WHERE lang='f1';"
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

    describe('place', function(err, data){



        it('create', function(cb){
            var dataContainer = {
                name : 'place',
                posx: 0.5,
                posy: 0.5,
                code: 'CZ'
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
                code: 'cz',
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
                code: 'cz',
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

        it('delete info', function(cb){
            var dataContainerCreate = {
                name : 'place_empty_info',
                code: 'cz',
                posx: 0.15,
                posy: 0.15
            };


            // create for update
            levels.create(pgClient, dataContainerCreate, function(err, crated){

                var dataContainer = {
                    id : crated.id,
                    name : 'place_6',
                    info : 'krasne-misto' + String(Date.now())
                };

                levels.updateinfo(pgClient,dataContainer, function(err, updated){
                    assert(!err);

                    //updated.should.have.property('name');
                    //updated.name.should.be.equal(dataContainer.name);

                    levels.deleteinfo(pgClient,dataContainer, function(err2, updated2){
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
                code: 'cz',
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
                code: 'cz',
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

        it('get - with images', function(cb){

            createPlaceWithImage('place_159', function(err, iid, created){
                var dataContainer = {
                    id: created[0].id,
                    fields : ['id','name','posx','posy','info'],
                    qfields : ['question','answers'],
                    ifields : ['iid','image'],
                    qlang : 'en',
                    lang : 'en'
                }


                levels.get(pgClient, dataContainer, function(err, getData){
                    should.not.exist(err);
                    should.exist(getData);


                    getData.should.have.property('questions');
                    getData.questions.length.should.be.equal(2);

                    getData.should.have.property('images');
                    getData.images.length.should.be.equal(3);
                    cb();
                })
            });
        });

        it('list',function(cb){
            var dataFields = {
                fields: ['id','name','posx','posy','size'],
                lang : 'en',
                langNative : 'cz'
            }

            levels.list(pgClient, dataFields, function(err,data){
                should.not.exists(err);
                should.exist(data);
                data.should.be.a.Array;
                data.length.should.be.above(1);
                data[0].name.should.be.String;
                cb();
            });
        });


        it('list unkonw lang',function(cb){
            var dataFields = {
                fields: ['id','name','posx','posy'],
                lang : '11'
            }

            levels.list(pgClient, dataFields, function(err,data){
                should.not.exists(err);
                should.exist(data);
                data.should.be.a.Array;
                data.length.should.be.above(1);
                data[0].name.should.be.String;
                cb();
            });
        });
    });
    describe('question', function(){

        it('add', function(cb){
            var dataContainerCreate = {
                name : 'place_150',
                code: 'cz',
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
                code: 'cz',
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
                code: 'cz',
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
                code: 'cz',
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
                code: 'cz',
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

    describe('langs', function(){
        it('with fr', function(cb){
            var lang = require('../../engine/translates/langs.js')
            var series = [];

            series.push(function(icb){
                lang.addlang(pgClient, {lang:'f1',name:'france1'}, icb)
            })

            series.push(function(icb){
                var dataContainerCreate = {
                    name : 'place_254',
                    posx: 0.15,
                    posy: 0.15,
                    code: 'f1',
                    info: 'info of place 254',
                    question : 'How many inhabitans living here?',
                    answers: 'in this city living 20 inhabitans.',
                    question2 : '2How many inhabitans living here?',
                    answers2: '2in this city living 20 inhabitans.'
                };

                // create for update
                createPlace(pgClient, dataContainerCreate, function(err, place){
                    var ser2 = [];

                    ser2.push(function(icb2){
                        lang.translate(pgClient, {link:place[3].link, lang:'f1',data:'f1placename'}, icb2);
                    })

                    ser2.push(function(icb2){
                        lang.translate(pgClient, {link:place[2].link_question, lang:'f1',data:'f1placename_question1'}, icb2);
                    })

                    ser2.push(function(icb2){
                        lang.translate(pgClient, {link:place[1].link_question, lang:'f1',data:'f1placename_question2'}, icb2);
                    })

                    Async.series(ser2, icb);
                });
            })


            series.push(function(icb){
                levels.langsAndCities(pgClient, 'en', function(err, image){
                    image.length.should.be.equal(3);
                    var f1 = image[2];
                    f1.cities.should.be.equal('1');
                    f1.questions.should.be.equal('1');
                    icb();
                });
            });





            Async.series(series, cb);
        });
    });
    describe('images', function(){
        it('from data - pinguin table', function(cb){
            createPlaceWithImage('place_155', function(err, iid, created){
                should.not.exists(err);
                should.exists(iid);

                iid.forEach(function(image){
                    var exists = fs.existsSync(images.IMG_ORIG_DIR + image.imageFile);
                    exists.should.be.ok;
//                    var exists2 = fs.existsSync(image.IMG_THUMB_DIR + image.image);
//                    exists2.should.not.ok;
                })
                //data.file = file;

                cb();
            })
         });



        it('get', function(cb){
            createPlaceWithImage('place_156', function(err, iid1, created){
                var dataContainer = {
                    place_id : created[0].id,
                    fields : ['*']
                }

                levels.iget(pgClient, dataContainer, function(err, image){
                    image.should.be.a.array;
                    image.length.should.be.above(0);
                    var row = image[0];
                    row.should.have.property('image');
                    row.should.have.property('iid');
                    row.place_id.should.be.equal(dataContainer.place_id);

                    image.forEach(function(img){
                        var exists = fs.existsSync(images.IMG_ORIG_DIR + img.image);
                        exists.should.be.ok;
                    });
                    cb();
                });
            })

        });

        it('delete one', function(cb){
            createPlaceWithImage('place_157', function(err, iid, created){
                var dataContainer = {
                    place_id : created[0].id,
                    iid : iid[0].imageId
                }

                levels.idelete(pgClient, dataContainer, function(err, deleted){
                    deleted[0].should.be.equal(dataContainer.iid);
                    var getDataContainer = {
                        place_id : created[0].id,
                        fields : ['*']
                    }

                    // createPlaceWithImage create 3 images
                    // after delete one should be still there 2two
                    levels.iget(pgClient, getDataContainer, function(err, geted){
                        geted.length.should.be.equal(2);
                        cb();
                    });
                });
            })

        });

        it('preview picture', function(cb){
            createPlaceWithImage('place_159_preview1', function(err, iid, created){
                var dataContainer = {
                    place_id : created[0].id,
                    preview_iid : iid[2].imageId
                }

                levels.ipreview(pgClient, dataContainer, function(err, preview){

                    var getDataContainer = {
                        place_id : created[0].id,
                        fields : ['*']
                    }

                    // createPlaceWithImage create 3 images
                    // after delete one should be still there 2two
                    levels.get(pgClient, getDataContainer, function(err, geted){
                        geted.length.should.be.equal(2);
                        cb();
                    });
                });
            })

        });

        it('preview picture', function(cb){
            createPlaceWithImage('place_159_checkAndSetupPreview3', function(err, iid, created){
                var dataContainer = {
                    place_id : created[0].id,
                    preview_iid : iid[2].imageId
                }

                levels.checkAndSetupPreview(pgClient, dataContainer, function(err, preview){

                    var getDataContainer = {
                        place_id : created[0].id,
                        fields : ['*']
                    }

                    // createPlaceWithImage create 3 images
                    // after delete one should be still there 2two
                    levels.get(pgClient, getDataContainer, function(err, geted){
                        geted.length.should.be.equal(2);
                        cb();
                    });
                });
            })

        });

        it('delete all', function(cb){

            createPlaceWithImage('place_158', function(err, iid, created){
                var dataContainer = {
                    place_id : created[0].id
                }

                levels.idelete(pgClient, dataContainer, function(err, deleted){
                    deleted.length.should.be.eql(iid.length);
                    iid.forEach(function(image){
                        deleted.should.containEql(image.imageId);
                        var exists = fs.existsSync(images.IMG_ORIG_DIR + image.image);
                        exists.should.not.ok;
                        var exists2 = fs.existsSync(images.IMG_THUMB_DIR + image.image);
                        exists2.should.not.ok;
                    })
                    var getDataContainer = {
                        place_id : created[0].id,
                        fields : ['*']
                    }

                    // createPlaceWithImage create 3 images
                    // after delete one should be still there 2two
                    levels.iget(pgClient, getDataContainer, function(err, geted){
                        geted.length.should.be.equal(0);
                        cb();
                    });
                });
            })

        });
    });

    describe('request', function(){

        it('get - levels', function(cb){
            //var ser = new server();


            var req =  request('http://localhost:8080');

            req.get('/pinguin/game/list/en/?fields=id,name,posx,posy,code')
                //.expect('Content-Type', /json/)
                //.expect('Content-Length', '20')
                .set('Content-Encoding', /json/)
                .expect(200)
                .expect('Content-Type', /json/)
                .end(function(err, res){
                    console.log(res.body);

                    res.body.response.should.be.array;
                    res.body.response.length.should.be.above(0);
                    var row = res.body.response[1];
                    row.should.have.a.property('id');
                    row.should.have.a.property('posx');
                    row.should.have.a.property('posy');
                    row.should.have.a.property('name');
                    if (err) {

                        throw err;

                    }
                    cb();
                });
        });

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


function createPlaceWithImage(name, cb){
    var dataContainerCreate = {
        name : name,
        posx: 0.15,
        posy: 0.15,
        code: 'cz',
        question : 'How many inhabitans living here?',
        answers: 'in this city living 20 inhabitans.',
        question2 : '2How many inhabitans living here?',
        answers2: '2in this city living 20 inhabitans.'
    };


    // create for update
    createPlace(pgClient, dataContainerCreate, function(err, created){
        if(err){
            cb(err, null, created);
            return;
        }


        var file = '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';

        var data = {
            file: file,
            type: 'image/jpeg'
        }

        var dataExtra = {
            tableName : 'pinguin.image_t',
            usrField : 'place_id',
            fileNamePrefix : 'place/',
            skipMD5Identity : true
        };
        images.storeImgFromData(pgClient, created[0].id,data, function(err, iid1){
            images.storeImgFromData(pgClient, created[0].id,data, function(err, iid2){

        images.storeImgFromData(pgClient, created[0].id,data, function(err, iid3){
           cb(err, [iid1,iid2,iid3], created);
        }, dataExtra)}, dataExtra)}, dataExtra);
    });
}