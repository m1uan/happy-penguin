var assert = require("assert"),
    words = require('../../engine/words.js'),
    pg = require('pg'),
    should = require('should')
    , async = require('async')
    ,config = require('../../config/local.js')
    ,request = require('supertest');

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

    describe('WORDS', function(){

        it('get cs and en', function(cb){
            words.WORDS(pgClient, 2001)
                .setUser(3)
                .addLang('cs')
                .addLang('en').get(['link','@userstatus','word as w','lang as n','image.image as imagefile'], function(err, data){
                   console.log(err,data);
                   assert(data);
                    data.should.be.a.Array;
                    data.length.should.above(0);
                    var data0 = data[0];
                    data0.should.have.property('link');
                    data0.should.have.property('qstatus');
                    data0.should.have.property('qmchanged');
                    data0.should.have.property('w1');
                    data0.should.have.property('n1');
                    data0.n1.should.have.eql('cs');
                    data0.should.have.property('w2');
                    data0.should.have.property('n2');
                    data0.should.have.property('imagefile');
                    data0.n2.should.have.eql('en');

                   cb();
                });
        })

        it('get only with question NO user', function(cb){
            words.WORDS(pgClient)
                .setUser(3)
                .addLang('de')
                .addLang('en').question(['@userstatus','link','word as w','lang as n','image.image as imagefile'], true, function(err, data){
                    console.log(err,data);
                    assert(data, err);
                    data.should.be.a.Array;
                    data.length.should.eql(2);
                    var data0 = data[0];
                    data0.should.have.property('link');
                    data0.should.have.property('userstatus');
                    data0.should.have.property('w1');
                    data0.should.have.property('n1');
                    data0.n1.should.have.eql('de');
                    data0.should.have.property('w2');
                    data0.should.have.property('n2');
                    data0.should.have.property('imagefile');
                    data0.n2.should.have.eql('en');

                    cb();
                });
        })

        it('get only with question', function(cb){
            words.WORDS(pgClient)
                .setUser(3)
                .addLang('de')
                .addLang('en').question(['@userstatus','link','word as w','lang as n','image.image as imagefile'], function(err, data){
                    console.log(err,data);
                    assert(data);
                    data.should.be.a.Array;
                    data.length.should.eql(3);
                    var data0 = data[0];
                    data0.should.have.property('link');
                    data0.should.have.property('userstatus');
                    data0.should.have.property('w1');
                    data0.should.have.property('n1');
                    data0.n1.should.have.eql('de');
                    data0.should.have.property('w2');
                    data0.should.have.property('n2');
                    data0.should.have.property('imagefile');
                    data0.n2.should.have.eql('en');

                    cb();
                });
        })

        it('get approve images withOUT user', function(cb){
            words.WORDS(pgClient)
                .addLang('de')
                .addLang('en').approveImages(['@userstatus','link','word as w','lang as n','image.image as imagefile','link.flag'], -1, function(err, data){
                    console.log(err,data);
                    assert(data);
                    data.should.be.a.Array;
                    //data.length.should.eql(3);
                    var data0 = data[0];
                    data0.should.have.property('link');
                    data0.should.have.property('userstatus');
                    data0.should.have.property('w1');
                    data0.should.have.property('n1');
                    data0.n1.should.have.eql('de');
                    data0.should.have.property('w2');
                    data0.should.have.property('n2');
                    data0.should.have.property('imagefile');
                    data0.n2.should.have.eql('en');

                    cb();
                });
        })

        it('get approve images WITH user', function(cb){
            words.WORDS(pgClient)
                .setUser(3)
                .addLang('de')
                .addLang('en').approveImages(['@userstatus','link','word as w','lang as n','image.image as imagefile','link.flag'], -1, function(err, data){
                    console.log(err,data);
                    assert(data);
                    data.should.be.a.Array;
                    //data.length.should.eql(3);
                    var data0 = data[0];
                    data0.should.have.property('link');
                    data0.should.have.property('userstatus');
                    data0.should.have.property('w1');
                    data0.should.have.property('n1');
                    data0.n1.should.have.eql('de');
                    data0.should.have.property('w2');
                    data0.should.have.property('n2');
                    data0.should.have.property('imagefile');
                    data0.n2.should.have.eql('en');

                    cb();
                });
        })
    });

    /**
     * [ 'cs', 'fr' ],
     [ 'mít šanci', 'une chance' ],
     [ 'v centru pozornosti', 'le centre de l\'attention' ],
     [ 'druhý večer', 'l\'autre soir' ],
     [ '', '' ] ]
     */
    describe('repeatedWord', function(){
        it('get word', function(cb){
            var testData = [[ 'v','fenster'],['paprsek', 'litva'],[ 'paprsek', 'litva']];


            words.getRepeatWords(pgClient, ['cs','de'], testData, function(err, rows){
                console.log(err ? err : rows);

                rows.should.be.a.Object;
                testData.forEach(function(td, idx){
                    var tdr = rows[idx];
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

        it('possible mistace like le centre de l\'attention', function(cb){
            var testData = [[ 'v','le c\'entre de l\'attention']];


            words.getRepeatWords(pgClient, ['cs','de'], testData, function(err, rows){
                console.log(err ? err : rows);

                rows.should.be.a.Object;

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

        });

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
                    rows00.should.have.property('del');

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

    describe('add words', function(){
        it('with exist link', function(cb){
            sqlMake(pgClient, ['Delete from word where link = 2094 and lang = \'cs\''], function(){
                var word = {
                    n1 : 'cs',
                    n2 : 'de',
                    w1 : 'le c\'entre de l\'attention',
                    w2 : 'Erklärung',
                    r1 : 'thus|de|hello',
                    r2 : 'hello|cs|tschus',
                    l : 2094,
                    d : 'ahoj'
                };

                words.addWord(pgClient, word, 2, function(err, rows){
                    console.log('test:words.addWord', err? err : rows);
                    assert(!err) ;

                    rows.should.have.property('l');
                    rows.l.should.be.eql(word.l);
                    rows.should.have.property('d');
                    rows.d.should.be.eql(word.d);

                    rows.should.have.property('w1');
                    rows.w1.should.be.a.Array;
                    rows.w1.length.should.eql(1);
                    rows.w1[0].should.have.property('word');
                    rows.w1[0].word.should.eql(word.w1);

                    rows.should.have.property('w2');
                    rows.w2.should.be.a.Array;
                    rows.w2.length.should.above(0);
                    rows.w2[0].should.have.property('word');

                    words.getWords(pgClient, 'cs', 4001, ['link','word','record'], function(words){
                        var find = false;
                        words.some(function(w){
                            if(w.link == 2094){
                                w.word.should.be.eql('le c\'entre de l\'attention');
                                w.record.should.be.eql('thus|de|hello');
                                find = true;
                            }
                            return find;
                        });

                        assert(find);
                        cb();
                    });

                });
            });

        });


        it('for lesson 4002', function(cb){
            //sqlMake(pgClient, ['Delete from word where link = 2094 and lang = \'cs\''], function(){
            var userId = 2;
            var word = {
                    n1 : 'cs',
                    n2 : 'de',
                    w1 : 'hello1',
                    w2 : 'tchus',
                    r1 : 'thus|de|hello',
                    r2 : 'hello|cs|tschus',
                    s : 4002,
                    d : 'ahoj'
                };

                words.addWord(pgClient, word, userId, function(err, rows){
                    console.log(err? err : rows);
                    assert(!err) ;


                    rows.should.have.property('l');
                    rows.l.should.be.eql(word.l);
                    rows.should.have.property('d');
                    rows.d.should.be.eql(word.d);

                    rows.should.have.property('w1');
                    rows.w1.should.be.a.Array;
                    rows.w1.length.should.eql(1);
                    rows.w1[0].should.have.property('word');
                    rows.w1[0].word.should.eql(word.w1);

                    rows.should.have.property('w2');
                    rows.w2.should.be.a.Array;
                    rows.w2.length.should.eql(1);
                    rows.w2[0].should.have.property('word');
                    rows.w2[0].word.should.eql(word.w2);

                    words.getWordsWithImages(pgClient, ['cs','de'], 4002, [['description', 'lesson','usr'], ['word', 'lang', 'record', 'word.usr as usr']], function(err, words){
                        var find = false;
                        assert(!err) ;
                        var link0 = words[0][0];
                        var cs0 = words[1][0];
                        var de0 = words[2][0];

                        link0.description.should.equal(word.d);
                        link0.lesson.should.equal(word.s);
                        link0.usr.should.equal(userId);
                        cs0.word.should.equal(word.w1);
                        de0.word.should.equal(word.w2);
                        cs0.lang.should.equal(word.n1);
                        de0.lang.should.equal(word.n2);
                        cs0.record.should.equal(word.r1);
                        de0.record.should.equal(word.r2);
                        cs0.usr.should.equal(userId);
                        de0.usr.should.equal(userId);

                        console.log(words);
                    });
                    cb();
                });
            //});

        });

    });


    describe('updateWord(lesson)', function(){
        it('update multiple word', function(cb){
            function updateWord(wordWord, icb){


                var word = {
                    word : wordWord
                    ,lang : 'cs'
                    ,link : 12
                    ,record : 'ahoj|de|predtim'};


                console.log(word);
                words.updateWord(pgClient, word, 2, function(err, rows){
                    console.log(err ? err : rows);
                    //err.should.be.Null;
                    rows.should.be.a.Array;


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
                words.getWordWithHistory(pgClient, 'cs', 1008, icb);
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
                    ,link : word.link
                };

                word.word += (word.version + 1);
                word.record = 'love you';
                console.log(word);

                words.updateWord(pgClient, word, 2, function(err, rows){
                    console.error('#words.updateWord',err,rows);


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
                wordOrig.record = 'love you';
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
                words.getWords(pgClient, lang, 101, function(rows){

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

    describe('search', function(){
        it('"extension"', function (cb){
           words.search(pgClient, {words:['extension', 'wife'], lang:'en', fields :['lesson as s','lid', 'desc', 'word']}, function(err, data){
               data.should.be.a.array;
               var word1 = data[0];
               word1[0].should.have.a.property('desc');
               word1[0].should.have.a.property('lid');
               word1[0].should.have.a.property('s');
               word1[0].should.have.a.property('word');
               cb();
           })
        });
    })

    describe('links', function(){
        it('1045,1046', function (cb){
            words.links(pgClient, {links:[1045, 1046], lang:'en', fields :['lesson as s','lid', 'desc', 'word']}, function(err, data){
                data.should.be.a.array;
                var word1 = data[0];
                word1.should.have.a.property('desc');
                word1.should.have.a.property('lid');
                word1.should.have.a.property('s');
                word1.should.have.a.property('word');
                cb();
            })
        });
    })

    describe('request', function(){

        it('get normal', function(cb){
            //var ser = new server();


            var req =  request('http://localhost:8080');

            req.get('/words/get/1001/cs/en?fields=word as w,del')
                //.expect('Content-Type', /json/)
                //.expect('Content-Length', '20')
                .set('Content-Encoding', /json/)
                .expect(200)
                .expect('Content-Type', /json/)
                .end(function(err, res){
                    console.log(res.body);

                    res.body.should.be.array;
                    var foundDeleted = res.body.some(function(r){
                        return r.del != 0;
                    });


                    foundDeleted.should.be.true;
                    if (err) {

                        throw err;

                    }
                    cb();
                });
        });

        it('get - not deleted', function(cb){
            //var ser = new server();


            var req =  request('http://localhost:8080');

            req.get('/words/get/1001/cs/en?fields=word as w,del&nd=0')
                //.expect('Content-Type', /json/)
                //.expect('Content-Length', '20')
                .set('Content-Encoding', /json/)
                .expect(200)
                .expect('Content-Type', /json/)
                .end(function(err, res){
                    console.log(res.body);

                    res.body.should.be.array;
                    var foundDeleted = res.body.some(function(r){
                        return r.del != 0;
                    });

                    foundDeleted.should.be.false;

                    if (err) {

                        throw err;

                    }
                    cb();
                });
        });

        it('get - type api', function(cb){
            //var ser = new server();


            var req =  request('http://localhost:8080');

            req.get('/words/get/1001/cs/en?fields=word as w,del&nd=0&type=api')
                //.expect('Content-Type', /json/)
                //.expect('Content-Length', '20')
                .set('Content-Encoding', /json/)
                .expect(200)
                .expect('Content-Type', /json/)
                .end(function(err, res){
                    console.log(res.body);

                    res.body.should.have.property('response');
                    res.body.response.should.have.property('words');
                    res.body.response.words.should.be.array;
                    var foundDeleted = res.body.response.words.some(function(r){
                        return r.del != 0;
                    });

                    foundDeleted.should.be.false;

                    if (err) {

                        throw err;

                    }
                    cb();
                });
        });


    });
})