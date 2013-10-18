var assert = require("assert"),
    words = require('../../engine/words.js'),
    pg = require('pg');

var pgClient = null;
var dbuser = 'voc4u';
var dbpass = 'voc4u';
var dbname = 'voc4u';

describe('getWords', function(){

    before(function(){
        var connection = 'postgres://'+dbuser+':'+dbpass+'@localhost/' + dbname;
        console.info('db connection: ' + connection);
        pgClient = new pg.Client(connection);
        pgClient.connect(function(err){
            if(err){
                return console.info('could not connect to postgres', err);
            }

        });
    });

    after(function(){
       pgClient.end();
        console.info('db connection close');
    });


    describe('getWords(cs)', function(){
        it('should return -1 when the value is not present', function(cb){
            words.getWords(pgClient, 'cs', 1, function(rows){
                assert(rows);
                cb();
            })

        })
    });
})