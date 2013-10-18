var assert = require("assert"),
    words = require('../../engine/words.js'),
    pg = require('pg'),
    should = require('should');

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
        it('should return null because wrong lesson index', function(cb){
            words.getWords(pgClient, 'cs', 0, function(rows){
                assert(rows == null);
                cb();
            })

        }),
        it('should return several rows', function(cb){
            words.getWords(pgClient, 'en', 1, function(rows){
                assert(rows);
                rows.length.should.be.eql(words.lessonSize);
                var rows0 = rows[0];
                rows0.should.have.property('link');
                rows0.should.have.property('word');
                rows0.should.have.property('history');
                rows0.should.have.property('lang');
                rows0.lang.should.eql('en');
                cb();
            })

        })
    });

    describe('getImages(lesson)', function(){
        it('get images from lesson 1', function(cb){
            words.getImages(pgClient, 1, 8, function(err, rows){
                console.error(err);
                assert(rows);
                cb();
            });
        });

    });
})