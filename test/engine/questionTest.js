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
            "SELECT remove_test_data();"  ,
            //"delete from question_message_t;",
            "delete from question_t;"
        ],cb);
    });


    describe('test questions', function(){
        it('without message', function(cb){
            var questionData = {
                 userId : 3,
                link: 1230,
                lang1 : 'cs'
                ,lang2 : 'en'
                //, message :  'i dont understand meaning on this word'
            } ;
            question.create(pgClient, questionData, function(err, data){
                console.log(err ? err : data);
                assert(data);
                data.should.have.property('qid');
                data.should.have.property('status');
                pgClient.query('SELECT status FROM question_t WHERE usr=$1 AND link=$2 AND lang1=$3 AND lang2=$4',
                    [questionData.userId, questionData.link, questionData.lang1, questionData.lang2],
                    function(err, td){
                        console.log(err ? err : td);
                        td.rows.should.be.a.Array;
                        td.rows.length.should.eql(1);
                        var r0 = td.rows[0];
                        r0.status.should.be.eql(1);
                        cb();
                    });

            })


        });


        it.only('with message', function(cb){
            var questionData = {
                userId : 3,
                linkId: 1230,
                lang1 : 'cs'
                ,lang2 : 'en'
                , message :  'i dont understand meaning on this word'
            } ;
            question.create(pgClient, questionData, function(err, data){
                console.log('test1', err ? err : data);
                assert(data);
                data.should.have.property('link');
                data.should.have.property('q_status');
                data.should.have.property('message');
                data.should.have.property('qid');
                pgClient.query('SELECT message FROM question_t WHERE usr=$1 AND qid=$2 AND lang1=$3 AND lang2=$4',
                    [questionData.userId, data.qid, questionData.lang1, questionData.lang2],
                    function(err, td){
                        console.log(err ? err : td);
                        td.rows.should.be.a.Array;
                        td.rows.length.should.eql(1);
                        var r0 = td.rows[0];
                        r0.should.have.property('message');
                        cb();
                    });

            })


        });

        it('create message 2x should be there generic message', function(cb){
            var questionData = {
                userId : 3,
                link: 1230,
                lang1 : 'cs'
                ,lang2 : 'en'
                //, message :  'i dont understand meaning on this word'
            } ;
            question.create(pgClient, questionData, function(err1, data1){
                console.log(err1 ? err1 : data1);
                question.create(pgClient, questionData, function(err, data){
                console.log(err ? err : data);
                pgClient.query('SELECT status FROM question_t WHERE usr=$1 AND link=$2 AND lang1=$3 AND lang2=$4',
                    [questionData.userId, questionData.link, questionData.lang1, questionData.lang2],
                    function(err, td){
                        console.log(err ? err : td);
                        td.rows.should.be.a.Array;
                        td.rows.length.should.eql(1);
                        var r0 = td.rows[0];
                        r0.status.should.be.eql(1);
                        cb();
                    });
                });

            })


        });
    });


})