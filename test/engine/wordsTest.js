var assert = require("assert"),
    words = require('../../engine/words.js'),
    pg = require('pg'),
    should = require('should')
    , async = require('async')
    ,config = require('../../config/local.js');

var pgClient = null;
var dbuser = config.DB_USER_TEST;
var dbpass = config.DB_PASS_TEST;
var dbname = config.DB_PASS_TEST;
var connection = 'postgres://'+dbuser+':'+dbpass+'@localhost/' + dbname;

describe.skip('getWords', function(){

    before(function(){

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
                //rows.length.should.be.eql(words.lessonSize);
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

    describe('getImages(lesson)', function(){
        it('get images from lesson 1', function(cb){
            words.getImages(pgClient, 1, 8, function(err, rows){
                console.error(err);
                assert(rows);
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

        it('update 3 cs', function(cb){



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
                words.getWords(pgClient, lang, 1, function(rows){

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