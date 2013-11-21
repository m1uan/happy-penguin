var assert = require("assert"),
    question = require('../../engine/question.js'),
    words = require('../../engine/words.js'),
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
            "delete from question_t;" ,
            "delete from question_message_t;"
        ],cb);
    });


    describe('test questions', function(){
        it.only('create message without message', function(cb){
            var questionData = {
                 userId : 3,
                link: 1230
                //, message :  'i dont understand meaning on this word'
            } ;
            question.create(pgClient, questionData, cb)


        });
    });


})