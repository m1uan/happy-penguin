var assert = require("assert"),
    words = require('../../engine/words.js'),
    pg = require('pg'),
    should = require('should')
    , async = require('async')
    ,config = require('../../config/local.js');

var pgClient = null;
var dbuser = config.DB_USER_TEST;
var dbpass = config.DB_PASS_TEST;
var dbname = config.DB_NAME_TEST;
var connection = 'postgres://'+dbuser+':'+dbpass+'@localhost/' + dbname;

var sqlMake = require('../../lib/helps/helps.js').sqlMake;

describe('getWords', function(){

    before(function(cb){

        console.info('db connection: ' + connection);
        pgClient = new pg.Client(connection);
        pgClient.connect(function(err){
            if(err){
                return console.info('could not connect to postgres', err);
            }
            sqlMake(pgClient, ['select create_test_data();'], cb);
        });
    });

    after(function(cb){
       sqlMake(pgClient, ['select remove_test_data();'], function(){
           pgClient.end();
           cb();
           console.info('db connection close');
       });


    });

    describe.only('repeatedWord', function(){


        it('get word', function(cb){
            var testData = [ 1001, 1002, 1125];


            words.getRepeatWords(pgClient, ['cs', 'de'], testData, function(err, rows){
                console.log(err ? err : rows);

                rows.should.be.a.Object;
                testData.forEach(function(td, idx){
                    var tdr = rows[td];
                    tdr.should.be.Array;
                    if(idx == 0){
                       tdr.length.should.above(1);
                       var tdr0 = tdr[0];
                       tdr0.should.have.a.property('l') ;
                       tdr0.should.have.a.property('s') ;
                       tdr0.should.have.a.property('w1') ;
                       tdr0.should.have.a.property('w2') ;
                       tdr0.should.have.a.property('d') ;

                    }
                });
                //console.log(rows);
                cb();
            });
        });

        it('get word', function(cb){
            var testData = [ 1003];


            words.getRepeatWords(pgClient, ['cs', 'de'], testData, function(err, rows){
                console.log(err ? err : rows);

                rows.should.be.a.Object;
                rows.should.have.property(1003);

                var find = 'have not object with preposition (das) object';
                rows[1003].some(function(td, idx){

                    if(td.l == 2090){
                        find = '';
                        return true;
                    }
                    return false;
                });

                find.should.be.empty;
                //console.log(rows);
                cb();
            });
        });

    });

    describe('getWords(cs)', function(){
        it('should return null because wrong lesson index', function(cb){
            words.getWords(pgClient, 'cs', 0, function(rows){
                assert(rows == null);
                cb();
            })

        }),
        it('should return several rows', function(cb){
            words.getWords(pgClient, 'en', 2001, function(rows){
                assert(rows);
                console.log(rows) ;
                //rows.length.should.be.eql(words.lessonSize);

                rows.should.be.Array;
                rows.length.should.be.above(0);
                var rows0 = rows[0];
                rows0.should.have.property('link');
                rows0.should.have.property('word');
                rows0.should.have.property('version');
                rows0.should.have.property('lang');
                rows0.lang.should.eql('en');
                cb();
            })

        })
    });

    describe('getWordsWithImages(cs)', function(){
            it('should return several rows', function(cb){
                words.getWordsWithImages(pgClient, ['en','cs'], 2001, function(err, rows){
                    //console.log(rows) ;
                    assert(rows);
                    rows.should.be.Array;
                    rows.should.have.length(3);
                    rows.length.should.be.eql(3);
                    rows[0].should.be.Array;
                    rows[1].should.be.Array;
                    rows[2].should.be.Array;

                    rows[0].should.not.be.Null
                    rows[0].length.should.be.above(0);
                    var rows00 = rows[0][0];
                    rows00.should.have.property('lid');
                    rows00.should.have.property('imagefile');
                    rows00.should.have.property('version');
                    rows00.should.have.property('description');

                    var rows10 = rows[1][0];
                    rows10.should.have.property('link');
                    rows10.should.have.property('word');
                    rows10.should.have.property('version');
                    rows10.should.have.property('lang');
                    rows10.lang.should.eql('en');
                    var rows20 = rows[2][0];
                    rows20.should.have.property('link');
                    rows20.should.have.property('word');
                    rows20.should.have.property('version');
                    rows20.should.have.property('lang');
                    rows20.lang.should.eql('cs');


                    cb();
                })

            })
    });

    describe('getImages(lesson)', function(){
        it('get images from lesson 1', function(cb){
            words.getImages(pgClient, 101, function(err, rows){
                //console.log(rows);

                rows.should.be.a.Array;
                rows.length.should.be.above(0);
                var row0 = rows[0];

                row0.should.have.property('lid');
                row0.should.have.property('description');
                row0.should.have.property('imagefile');

                cb();
            });
        });

    });




    describe('updateWord(lesson)', function(){
        it('update multiple word', function(cb){
            function updateWord(wordWord, icb){


                var word = {
                    word : wordWord
                    ,lang : 'cs'
                    ,link : 12 };


                console.log(word);
                words.updateWord(pgClient, word, 2, function(err, rows){
                    console.error(err);


                    assert(rows);


                    var finded = false;
                    // test if new word have version == 0
                    rows.forEach(function(wordNew, idx){
                        if(wordNew.word == word.word){
                            assert(wordNew.version == 0, 'created new word :' + word.word + ' have not version = 0');
                            finded = true;
                        }
                    });
                    assert(finded, 'the updated word ' +word.word+ ' missing between sets');
                    icb(err, rows);
                });

            }


            var ser = [];

            ['+šěč', 'sp', 'dsfew',')úpů','=šč+','řžé='].forEach(function(val, idx){
                var fun = function(cb){
                    updateWord(val, cb);
                }

                ser.push(fun);
            }) ;

            async.series(ser,cb);
        });

        it.skip('update 3 cs', function(cb){



            function getVersion(icb){
                words.getWordWithHistory(pgClient, 'cs', 11, icb);
            }

            function updateWord(resultFromVersion, icb2){
                var word = null;

                resultFromVersion.forEach(function(val, idx){

                    if(!word || word.version < val.version){
                        word = val;
                    }
                });

                var wordOrig = {
                    word : word.word
                    ,lang : word.lang
                    ,link : word.link };

                word.word += (word.version + 1);

                console.log(word);

                words.updateWord(pgClient, word, 2, function(err, rows){
                    console.error(err);


                    assert(rows);
                    assert(rows.length == resultFromVersion.length + 1);

                    var finded = false;
                    // test if new word have version == 0
                    rows.forEach(function(wordNew, idx){
                        if(wordNew.word == word.word){
                            assert(wordNew.version == 0, 'created new word :' + word.word + ' have not version = 0');
                            finded = true;
                        }
                    });
                    assert(finded, 'the updated word ' +word.word+ ' missing between sets');
                    icb2(err, rows, wordOrig);
                });

            }


            function reuseWord(rowsFromUpdate, wordOrig, icb){
                words.updateWord(pgClient, wordOrig, 3, function(err, rows){
                    console.error(err);
                    console.log(rows);
                    assert(rows);
                    assert(rows.length == rowsFromUpdate.length);

                    // test if wordOrig have again version == 0
                    rows.forEach(function(word, idx){
                        if(word.word == wordOrig.word){
                            assert(word.version == 0, 're-used word :' + word.word + ' have not version = 0');
                        }
                    });

                    icb(err, rows);
                });
            }

            function testInWordset(updatedRows, icb){
                var lang = updatedRows[0].lang;
                var link = updatedRows[0].link;

                console.log('testInWordset lang,link : (' + lang + ',' + link + ')');
                words.getWords(pgClient, lang, 2001, function(rows){

                    var linkNotMissing = false;
                    // test if wordOrig have again version == 0
                    rows.forEach(function(word, idx){
                        if(word.link == link){
                            linkNotMissing = true;
                        }
                    });

                    assert(linkNotMissing, 'Word with link = ' + link + ' missing in getWords');
                    icb(null, rows);
                });
            }

            async.waterfall([
                getVersion
                ,updateWord
                , reuseWord
                , testInWordset
            ], cb);
        });

    });
})