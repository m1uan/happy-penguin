var assert = require("assert"),
    SL = require('../../lib/happy/sqllib.js'),
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
            "SELECT remove_test_data();"

        ],cb);
    });


    describe('SQL', function(){
        it('select', function(){

            var SQL = SL.SqlLib('link',['w1.word']);
            SQL.join('word w1', 'w1.link=link.lid');
            SQL.whereAnd('link', 123);
            SQL.addOrderBy('link.lid');
            var sql = SQL.generateSelect();

            console.log(sql);
            sql.should.equal('SELECT w1.word FROM link LEFT JOIN word w1 ON w1.link=link.lid WHERE link=$1 ORDER BY link.lid');

        });

        it('upsert', function(){

            var SQL = SL.SqlLib('question_status_t');

            var sql = SQL.generateUpsert({status:1,link:1234},['status','link']);

            console.log(sql);
            sql.should.equal("UPDATE question_status_t SET status=$0,link=$1 RETURNING status,link;INSERT INTO question_status_t (status,link)SELECT $1,$2 WHERE NOT EXISTS (SELECT 1 FROM question_status_t WHERE status='1' AND link='1234') RETURNING status,link;");
        });

    });


})