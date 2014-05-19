var LocalStrategy = require('passport-local').Strategy,
    SL = require(process.cwd() + '/lib/happy/sqllib.js')
    , translate = require('../translates/langs.js')
    ,async = require('async');

var LEVEL_GROUP = 1000;
var QUESTION_GROUP = 1001;

module.exports = {
    initialize : function(server, Passport) {

    },create: function(pg, dataContainer, cb){
        if(!dataContainer.posx || !dataContainer.posy || !dataContainer.name || !dataContainer.code){
            cb('missing position posx, posy, name or/and code');
        }

        var cascade = [];

        // create translation for place
        cascade.push(function(icb){
            var add = {
                key : '_city_' + dataContainer.name,
                desc: dataContainer.name,
                lang:'en',
                group:LEVEL_GROUP
            }
            translate.addtranslate(pg, add, icb);
        });

        // create new place
        cascade.push(function(addtranslate, icb){
            var sql = 'INSERT INTO pinguin.place_t (posx,posy,name,code) VALUES ($1,$2,$3,$4) RETURNING id,posx,posy,code';


            pg.query(sql, [dataContainer.posx,dataContainer.posy, addtranslate.link, dataContainer.code], function(err, place){
                if(place && place.rows){
                    place = place.rows[0];
                    place.namelink = addtranslate.link;
                    place.name = addtranslate.desc;
                }

                icb(err,place);
            });
        });


        async.waterfall(cascade, cb);
    },updatepos : function(pg, dataContainer, cb){
        if(!dataContainer.id ){
            cb('missing id');
            return;
        }

        var setData = null;

        if(dataContainer.posx){
            if(!setData){
                setData = {};
            }
            setData.posx = dataContainer.posx;
        }

        if(dataContainer.posy){
            if(!setData){
                setData = {};
            }
            setData.posy = dataContainer.posy;
        }

        if(setData){
            var SQL = SL.SqlLib('pinguin.place_t');
            SQL.whereAnd('id=' + dataContainer.id);


            SQL.update(pg, setData, function(err, res){
                if(res && res[0]){
                    res = res[0];
                }
                cb(err, res);
            });
        } else {
            cb('nothing to update (just posx, posy could be updated)!');
        }
    },updatename: function(pg, dataContainer, cb){
        updateTextField(pg, {id:dataContainer.id, text: dataContainer.name}, 'name', cb);
    },updateinfo: function(pg, dataContainer, cb){
        updateTextField(pg, {id:dataContainer.id, text: dataContainer.info}, 'info', cb);
    },get: function(pg, dataContainer, cb){
        if(!dataContainer.id){
            cb('missing id!');
            return;
        }

        if(!dataContainer.lang){
            dataContainer.lang = 'en';
        }

        if(!dataContainer.qlang){
            dataContainer.qlang = 'en';
        }

        var parallel = [];

        parallel.push(function(icb){
            module.exports.placeget(pg, dataContainer, icb);
        });

        if(dataContainer.qfields){
            parallel.push(function(icb){
                var questionContainer = {
                    qlang : dataContainer.qlang,
                    alang : dataContainer.lang,
                    place_id : dataContainer.id,
                    fields : dataContainer.qfields
                }
                module.exports.qget(pg, questionContainer, icb);
            });
        }

        if(dataContainer.ifields){
            parallel.push(function(icb){
                var imagesContainer = {
                    place_id : dataContainer.id,
                    fields : dataContainer.ifields
                }
                module.exports.iget(pg, imagesContainer, icb);
            });
        }

        async.parallel(parallel, function(err, gets){
            var out = null;
            if(!err && gets){
                out = gets[0];
                if(gets.length > 1 && gets[1]){
                   out.questions = gets[1];
                } else {
                   out.questions = [];
                }

                if(gets.length > 2 && gets[2]){
                    out.images = gets[2];
                } else {
                    out.images = [];
                }
            }
            cb(err,out);
        });

    },placeget: function(pg, dataContainer, cb){
        var fields = dataContainer.fields;

        if(!fields){
            fields = ['id'];
        }


        var indexOfName = fields.indexOf('name');
        if(indexOfName> -1){
            fields[indexOfName] = 'ttn.data as name'
        }

        var indexOfInfo = fields.indexOf('info');
        if(indexOfInfo> -1){
            fields[indexOfInfo] = 'tti.data as info'
        }

        var SQL = SL.SqlLib('pinguin.place_t as pp', fields);
        SQL.whereAnd('id=' + dataContainer.id);


        if(indexOfName> -1){
            SQL.join('translates.translate_t as ttn','ttn.link=pp.name AND (ttn.lang=\''+dataContainer.lang+'\')');
        }

        if(indexOfInfo> -1){
            SQL.join('translates.translate_t as tti','tti.link=pp.info AND (tti.lang=\''+dataContainer.lang+'\')');
        }

        SQL.select(pg,function(err, place){
            if(place && place[0]){
                place = place[0];
            }

            cb(err, place);
        })
    },qadd : function(pg, dataContainer, cb){
        if(!dataContainer.place_id){
            cb('place_id missing "place_t.id"');
            return;
        }

        if(!dataContainer.question){
            cb('question text missing');
            return;
        }

        if(!dataContainer.answers){
            cb('answers text missing');
            return;
        }


        var parallel = [];
        var watter = [];


        // add question
        parallel.push(function(icb){
            var questinData = {
                desc:dataContainer.question,
                group: QUESTION_GROUP
            }
            translate.addtranslate(pg, questinData, icb);
        });

        // add answer
        parallel.push(function(icb){
            var questinData = {
                desc:dataContainer.answers,
                group: QUESTION_GROUP
            }
            translate.addtranslate(pg, questinData, icb);
        });


        // add parallaly question and answer
        watter.push(function(icb){
            async.parallel(parallel, icb);
        });

        // update question with answer and question
        watter.push(function(qa, icb){
            var sql = 'INSERT INTO pinguin.question_t (place_id,question,answers) VALUES ($1,$2,$3) RETURNING qid';

            pg.query(sql, [dataContainer.place_id, qa[0].link, qa[1].link], icb);
        });

        // select the result
        watter.push(function(q, icb){
            var fields = [
                'qid',
                'place_id',
                'ttq.data as question',
                'tta.data as answers'
            ]

            var SQL = SL.SqlLib('pinguin.question_t as pq', fields);
            SQL.join('translates.translate_t as ttq','ttq.link=pq.question AND ttq.lang=\'en\'');
            SQL.join('translates.translate_t as tta','tta.link=pq.answers AND tta.lang=\'en\'');
            SQL.whereAnd('pq.qid='+ q.rows[0].qid);
            SQL.select(pg, icb);
        });

        async.waterfall(watter, function(err, data){cb(err, data[0])});
    },qupdate : function(pg, dataContainer, cb){
        if(!dataContainer.qid){
            cb('qid missing');
            return;
        }

        if(!dataContainer.question){
            cb('question text missing');
            return;
        }

        if(!dataContainer.answers){
            cb('answers text missing');
            return;
        }

        var watter = [];
        var parallel = [];



        watter.push(function(icb){
            var SQL = SL.SqlLib('pinguin.question_t as pq', ['question','answers']);
            SQL.whereAnd('pq.qid='+dataContainer.qid);
            SQL.select(pg, icb);
        });

        watter.push(function(q, icb){
            dataContainer.question_link = q[0].question;
            dataContainer.answers_link = q[0].answers;

            parallel.push(function(icb2){
                var questionContainer = {
                    data:dataContainer.question,
                    link:q[0].question
                };
                updateDescAndTranslate(pg, questionContainer, icb2)
            });

            parallel.push(function(icb2){
                var answersContainer = {
                    data:dataContainer.answers,
                    link:q[0].answers
                };
                updateDescAndTranslate(pg, answersContainer, icb2)
            });

            async.parallel(parallel, icb);
        });



        async.waterfall(watter, function(err, updated){
            var question = null;
            if(updated){
                question = {
                    question: updated[0].data,
                    answers: updated[1].data,
                    qid:dataContainer.qid
                }
            }

            cb(err, question);
        });
    },qdelete : function(pg, dataContainer, cb){
        if(!dataContainer.place_id){
            cb('place_id missing');
            return;
        }

        var series = []
        var watter = [];
        var parallel = [];

        series.push(function(icb){
            var SQL = SL.SqlLib('pinguin.question_t as pq', ['qid','question','answers']);
            SQL.whereAnd('pq.place_id='+dataContainer.place_id);
            if(dataContainer.qid){
                SQL.whereAnd('pq.qid='+dataContainer.qid);
            }

            SQL.select(pg, icb);
        });

        series.push(function(icb){
            var sql = 'DELETE FROM pinguin.question_t WHERE place_id=' +dataContainer.place_id;
            if(dataContainer.qid){
                sql += ' AND qid='+dataContainer.qid;
            }
            pg.query(sql,icb);
        })

        watter.push(function(icb){
            async.series(series, icb);
        });

        watter.push(function(q, icb){
            var qids = [];
            // add to parallel every selected question
            q[0].forEach(function(question){
                parallel.push(function(icb2){
                    var questionContainer = {
                        link:question.question
                    };
                    translate.delete(pg, questionContainer, icb2)
                });

                parallel.push(function(icb2){
                    var answersContainer = {
                        link:question.answers
                    };
                    translate.delete(pg, answersContainer, icb2)
                });

                qids.push(question.qid);
            });


            async.parallel(parallel, function(err, trans){
                icb(err, qids);
            });
        });



        async.waterfall(watter, cb);
    },qget: function(pg, dataContainer, cb){

        if(!dataContainer.place_id){
            cb('place_id missing');
            return;
        }

        if(!dataContainer.qlang){
            cb('qlang missing');
            return;
        }

        if(!dataContainer.alang){
            cb('alang missing');
            return;
        }

        var qlang = dataContainer.qlang;
        var alang = dataContainer.alang;


        var fields = [ 'qid' ];
        if(dataContainer.fields){
            fields = dataContainer.fields;
        }

        var indexOfQuestion = fields.indexOf('question');
        if(indexOfQuestion > -1){
            fields[indexOfQuestion] = 'ttq.data as question';
        }

        var indexOfAnswers = fields.indexOf('answers');
        if(indexOfAnswers > -1){
            fields[indexOfAnswers] = 'tta.data as answers';
        }

        var SQL = SL.SqlLib('pinguin.question_t as pq', fields);

        if(indexOfQuestion > -1){
            SQL.join('translates.translate_t as ttq','ttq.link=pq.question AND ttq.lang=\''+qlang+'\'');
        }

        if(indexOfAnswers > -1){
            SQL.join('translates.translate_t as tta','tta.link=pq.answers AND tta.lang=\''+alang+'\'');
        }
        SQL.whereAnd('pq.place_id='+ dataContainer.place_id);
        SQL.select(pg, cb);
    },iget: function(pg, dataContainer, cb){

        if(!dataContainer.place_id){
            cb('place_id missing');
            return;
        }



        var fields = [ 'iid' ];
        if(dataContainer.fields){
            fields = dataContainer.fields;
        }

        var SQL = SL.SqlLib('pinguin.image_t', fields);

        SQL.whereAnd('pinguin.image_t.place_id='+ dataContainer.place_id);
        SQL.select(pg, cb);
    },idelete: function(pg, dataContainer, cb){

        if(!dataContainer.place_id){
            cb('place_id missing');
            return;
        }

//        if(!dataContainer.iid){
//            cb('iid missing');
//            return;
//        }



        var series = []
        var watter = [];
        var parallel = [];

        series.push(function(icb){
            var SQL = SL.SqlLib('pinguin.image_t', ['iid','image']);
            SQL.whereAnd('pinguin.image_t.place_id='+dataContainer.place_id);
            if(dataContainer.iid){
                SQL.whereAnd('pinguin.image_t.iid='+dataContainer.iid);
            }

            SQL.select(pg, icb);
        });

        series.push(function(icb){
            var sql = 'DELETE FROM pinguin.image_t WHERE place_id=' +dataContainer.place_id;
            if(dataContainer.iid){
                sql += ' AND iid='+dataContainer.iid;
            }
            pg.query(sql,icb);
        })

        watter.push(function(icb){
            async.series(series, icb);
        });

        watter.push(function(i, icb){
            var iids = [];
            // add to parallel every selected question
            i[0].forEach(function(image){
                parallel.push(function(icb2){


                    removeImageFile('orig',image.image, icb2);
                });

                parallel.push(function(icb2){
                    removeImageFile('thumb',image.image, icb2);
                });


                iids.push(image.iid);
            });


            async.parallel(parallel, function(err, trans){
                icb(err, iids);
            });
        });



        async.waterfall(watter, cb);
    }, list : function(pg, dataContainer, cb){

        var fields = 'id'
        if(dataContainer.fields){
            fields = dataContainer.fields;
        }

        var lang = 'en';
        if(dataContainer.lang){
            lang = dataContainer.lang;
        }

        var indexOfName = fields.indexOf('name');
        if(indexOfName > -1){
            fields[indexOfName] = 'ttn.data as name';
        }

        var SQL = SL.SqlLib('pinguin.place_t pp', fields);
        if(indexOfName > -1){
            SQL.join('translates.translate_t as ttn','ttn.link=pp.name AND ttn.lang=\''+lang+'\'');
        }
        SQL.select(pg, cb);
    }, langsAndCities : function(pg, lang, cb){
        var langEngine = require(process.cwd() + '/engine/translates/langs.js');

        var dataContainer = {
            lang_of_names : lang
        };

        langEngine.getlangs(pg, ['lang','name','translate'], dataContainer, function(err,langData){
            if(err){
                cb(err);
                return ;
            }

            var SQL = '';
            langData.forEach(function(lang){
                SQL += ' UNION SELECT (SELECT count(*) from pinguin.place_t' +
                    ' join translates.translate_t on translates.translate_t.link=pinguin.place_t.name where translates.translate_t.lang=\''+lang.lang+'\') as cities' +
                    ',(SELECT count(*) from pinguin.place_t' +
                    ' join pinguin.question_t on pinguin.question_t.place_id=pinguin.place_t.id' +
                     ' join translates.translate_t on translates.translate_t.link=pinguin.question_t.question' +
                    ' where translates.translate_t.lang=\''+lang.lang+'\') as questions' +
                    ', \'' + lang.lang +'\' as lang'

            });

            SQL = SQL.substr(6);
            pg.query(SQL, function(err, data){

                if(data.rows){
                    data.rows.forEach(function(city){
                        langData.some(function(lang){
                            if(lang.lang == city.lang){
                                lang.cities = city.cities;
                                lang.questions = city.questions;

                                return true;
                            }
                        });
                    })
                }


                cb(err, langData);
            });
        });
    }
}

function updateTextField(pg, dataContainer, type, cb){
    if(!dataContainer.id){
        cb('missing field id!');
        return;
    }
    if(!dataContainer.text){
        cb('missing field '+type+'!');
        return;
    }

    var typeSQL = type ;
    var watter = [];

    // get exists of text in table
    watter.push(function(icb){
        var SQL = SL.SqlLib('pinguin.place_t',[typeSQL]);
        SQL.whereAnd('id=' + dataContainer.id);
        SQL.select(pg, icb);
    });


    // try create if not exists for this level
    watter.push(function(selectLinkOfType, icb){
        var addOrUpdate = {
            key : '_city_' + type + '_' + dataContainer.id,
            desc: dataContainer.text,
            data: dataContainer.text,
            group: LEVEL_GROUP,
            lang : 'en'
        }

        // the translation is already connected to this table
        // update just the translation
        if(selectLinkOfType[0] && selectLinkOfType[0][type]){
            // add linked link :-)
            addOrUpdate.link = selectLinkOfType[0][type];
            updateDescAndTranslate(pg, addOrUpdate, icb);
        } else {
            // create new translation
            translate.addtranslate(pg, addOrUpdate, function(err, added){

                // created link is for next step to know
                // he have update place_t table
                if(added){
                    added.createdlink = added.link;
                }

                icb(err, added);
            });
        }
    });


    // store link to place if was created
    watter.push(function(lang, icb){
        if(lang.createdlink){

            var SQL = SL.SqlLib('pinguin.place_t');
            SQL.whereAnd('id=' + dataContainer.id);


            var ud = {};
            ud[type] = lang.createdlink;
            SQL.update(pg, ud, function(err, updated){
                icb(err, lang);
            });
        } else {
            // skip because language.link_t table was update
            // and link was already add to this table before
            icb(null, lang);
        }

    });

    async.waterfall(watter, function(err, data){
        data[type] = data.desc;
        cb(err, data);
    })

}

// update and tranalsate because in levels
// you see only description of translation
// have to be same with english version of translate
// dataContainer = {
//          desc:'desc',
//          key:'key',
//          group:'* group',
//          link:xxx
// }
function updateDescAndTranslate(pg, dataContainer, cb){
    var parallel = [];

    if(!dataContainer.desc){
        dataContainer.desc = dataContainer.data;
    }

    // update desc
    parallel.push(function(icb){
        translate.updatedesc(pg, dataContainer, icb);
    });

    // update english version
    parallel.push(function(icb){
        translate.translate(pg, dataContainer, icb);
    });

    async.parallel(parallel, function(err, updatedesc, translate){
        cb(err, updatedesc[1]);
    });
}


function removeImageFile(type, fileName, cb){
    var fs = require('fs');
    var image = require(process.cwd() + '/engine/image.js');

    var path = image.IMG_ORIG_DIR;
    if(type=='thumb'){
        path = image.IMG_THUMB_DIR;
    }

    var filePath = path+ fileName;

    if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
    }

    cb();

}