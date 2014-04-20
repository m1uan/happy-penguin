var assert = require("assert"),
    SL = require('../../lib/happy/sqllib.js'),
    translates = require('../../engine/translates/langs.js'),
    pg = require('pg'),
    should = require('should')
    , Async = require('async')
    ,config = require('../../config/local.js')
    ,fs = require('fs');

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
        cb();
    });


    describe.only('langs', function(){
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


    });


})