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


        it('update', function(cb){
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


                levels.update(pgClient,dataContainer, function(err, updated){
                    assert(!err);

                    updated.should.have.property('posx');
                    updated.should.have.property('posy');
                    cb();
                });

            });


        });
    });


});