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


    describe('questions', function(){
        it('without message', function(cb){
            var questionData = {
                userId : 3,
                linkId: 1431,
                lang1 : 'cs'
                ,lang2 : 'en'
                //, message :  'i dont understand meaning on this word'
            } ;
            question.changeStatus(pgClient, questionData, function(err, data){
                console.log(err ? err : data);
                assert(data);
                /*{
                 status : statusLink.status,
                 link : statusLink.link,
                 message : message.message,
                 user : message.usr,
                 changed : message.changed
                 }*/
                data.should.have.property('link');
                data.should.have.property('status');
                data.should.have.property('message');
                data.should.have.property('user');
                data.should.have.property('changed');
                pgClient.query('SELECT message FROM question_t WHERE link=$1 AND usr=$2 AND lang1=$3 AND lang2=$4',
                    [questionData.linkId, questionData.userId, questionData.lang1, questionData.lang2],
                    function(err, td){
                        console.log(err ? err : td);
                        td.rows.should.be.a.Array;
                        td.rows.length.should.eql(1);
                        var r0 = td.rows[0];
                        r0.message.should.be.eql('*note: set STATUS to: 1');
                        cb();
                    });

            })


        });


        it('with message', function(cb){
            var questionData = {
                userId : 3,
                linkId: 1431,
                lang1 : 'cs'
                ,lang2 : 'en'
                , message :  'i dont understand meaning on this word'
            } ;
            question.changeStatus(pgClient, questionData, function(errw, dataw){
            question.changeStatus(pgClient, questionData, function(err, data){
                console.log(err ? err : data);
                assert(data);
                /*{
                 status : statusLink.status,
                 link : statusLink.link,
                 message : message.message,
                 user : message.usr,
                 changed : message.changed
                 }*/
                data.should.have.property('link');
                data.should.have.property('status');
                data.should.have.property('message');
                data.should.have.property('user');
                data.should.have.property('changed');
                pgClient.query('SELECT message FROM question_t WHERE link=$1 AND usr=$2 AND lang1=$3 AND lang2=$4',
                    [questionData.linkId, questionData.userId, questionData.lang1, questionData.lang2],
                    function(err, td){
                        console.log(err ? err : td);
                        td.rows.should.be.a.Array;
                        td.rows.length.should.eql(1);
                        var r0 = td.rows[0];
                        r0.message.should.be.eql('i dont understand meaning on this word');
                        cb();
                    });

            })
            });
        });

        it.only('get messages', function(cb){
            question.get(pgClient, null, function(errw, dataw){
                cb();
            });
        });
    });
})