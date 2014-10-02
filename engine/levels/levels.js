var LocalStrategy = require('passport-local').Strategy,
    SL = require(process.cwd() + '/lib/happy/sqllib.js')
    , translate = require('../translates/langs.js')
    ,async = require('async');

var LEVEL_GROUP = 1000;
var QUESTION_GROUP = 1001;

module.exports = (function(){
    var self = {};
    self.initialize = function(server, Passport) {

    }

    self.create = function(pg, dataContainer, cb){
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
    }

    self.updatepos = function(pg, dataContainer, cb){
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
    }

    self.updatename = function(pg, dataContainer, cb){
        updateTextField(pg, {id:dataContainer.id, text: dataContainer.name}, 'name', cb);
    }

    self.updateinfo = function(pg, dataContainer, cb){
        updateTextField(pg, {id:dataContainer.id, text: dataContainer.info}, 'info', cb);
    }

    self.deleteinfo = function(pg, dataContainer, cb){
        var watter = [];

        watter.push(function(icb){
            var SQL = 'SELECT info FROM pinguin.place_t WHERE id='+dataContainer.id;
            pg.query(SQL, icb);
        });

        watter.push(function(info, icb){
            var SQL = 'UPDATE pinguin.place_t SET info=null WHERE id='+dataContainer.id + ' RETURNING info';
            pg.query(SQL, function(err, data){
                // very probably wasn't before error so
                // info.rows[0] must have a data
                var infoData = {
                    link: info.rows[0].info
                };
                icb(err, infoData);
            });
        });

        watter.push(function(infoData, icb){
            translate.delete(pg, infoData, icb);
        });

        async.waterfall(watter, function(err, data){
            cb(err, {info:null});
        });
    }

    self.get = function(pg, dataContainer, cb){
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

    }

    self.placeget = function(pg, dataContainer, cb){
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

        var indexOfInfoNative = fields.indexOf('info_native');
        if(indexOfInfoNative> -1){
            fields[indexOfInfoNative] = 'ttin.data as info_native'
        }

        var SQL = SL.SqlLib('pinguin.place_t as pp', fields);
        SQL.whereAnd('id=' + dataContainer.id);


        if(indexOfName> -1){
            SQL.join('translates.translate_t as ttn','ttn.link=pp.name AND (ttn.lang=\''+dataContainer.lang+'\')');
        }

        if(indexOfInfo> -1){
            SQL.join('translates.translate_t as tti','tti.link=pp.info AND (tti.lang=\''+dataContainer.lang+'\')');
        }

        if(indexOfInfoNative> -1){
            SQL.join('translates.translate_t as ttin','ttin.link=pp.info AND (ttin.lang=\''+dataContainer.qlang+'\')');
        }

        SQL.select(pg,function(err, place){
            if(place && place[0]){
                place = place[0];
            }

            cb(err, place);
        })
    }

    self.qadd = function(pg, dataContainer, cb){
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


        if(!dataContainer.type){
            dataContainer.type = 0;
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
            var sql = 'INSERT INTO pinguin.question_t (place_id,question,answers,type) VALUES ($1,$2,$3,$4) RETURNING qid';

            pg.query(sql, [dataContainer.place_id, qa[0].link, qa[1].link, dataContainer.type], icb);
        });

        // select the result
        watter.push(function(q, icb){
            var fields = [
                'qid',
                'place_id',
                'ttq.data as question',
                'tta.data as answers',
                'ttq.link as link_question',
                'pq.type as type'
            ]

            var SQL = SL.SqlLib('pinguin.question_t as pq', fields);
            SQL.join('translates.translate_t as ttq','ttq.link=pq.question AND ttq.lang=\'en\'');
            SQL.join('translates.translate_t as tta','tta.link=pq.answers AND tta.lang=\'en\'');
            SQL.whereAnd('pq.qid='+ q.rows[0].qid);
            SQL.select(pg, icb);
        });

        async.waterfall(watter, function(err, data){cb(err, data[0])});
    }

    self.qupdate = function(pg, dataContainer, cb){
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

        if(!dataContainer.type){
            dataContainer.type = 0;
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

            parallel.push(function(icb2){
                var questionContainer = {
                    type:dataContainer.type
                };

                var SQL = SL.SqlLib('pinguin.question_t');
                SQL.whereAnd('qid=' + dataContainer.qid);
                SQL.update(pg, questionContainer, icb2);
            });

            async.parallel(parallel, icb);
        });



        async.waterfall(watter, function(err, updated){
            var question = null;
            if(updated){
                question = {
                    question: updated[0].data,
                    answers: updated[1].data,
                    qid:dataContainer.qid,
                    type : dataContainer.type
                }
            }

            cb(err, question);
        });
    }

    self.qdelete = function(pg, dataContainer, cb){
        qdelete(pg, dataContainer, cb);
    }

    self.qget = function(pg, dataContainer, cb){

        if(!dataContainer.place_id){
            cb('place_id missing');
            return;
        }

        if(!dataContainer.qlang){
            cb('qlang (native) missing');
            return;
        }

        if(!dataContainer.alang){
            cb('alang (learn) missing');
            return;
        }

        // let alang - answer lang : learn lang
        var learnLang = dataContainer.alang;
        // let qlang - question lang : native learn
        var nativeLang = dataContainer.qlang;


        var fields = [ 'qid' ];
        if(dataContainer.fields){
            fields = dataContainer.fields;
        }

        var indexOfQuestion = fields.indexOf('question');
        if(indexOfQuestion > -1){
            fields[indexOfQuestion] = 'ttq.data as question';
            //fields.push('ttqn.data as question_native');
        }

        var indexOfAnswers = fields.indexOf('answers');
        if(indexOfAnswers > -1){
            fields[indexOfAnswers] = 'tta.data as answers';
        }

        var indexOfType = fields.indexOf('type');
        if(indexOfType > -1){
            fields[indexOfType] = 'pq.type as type';
        }

        var SQL = SL.SqlLib('pinguin.question_t as pq', fields);

        if(indexOfQuestion > -1){
            // if is type 0 (translate from native to learn)
            // if is type 2 (answer is in native, you have create a question in learn)
            // if is type 3 (question is in native but answer have to be in learn)

            SQL.join('translates.translate_t as ttq','ttq.link=pq.question AND ttq.lang=\''+nativeLang+'\'');
            //SQL.join('translates.translate_t as ttqn','ttqn.link=pq.question AND ttqn.lang=\''+nativeLang+'\'');
        }

        if(indexOfAnswers > -1){
            SQL.join('translates.translate_t as tta','tta.link=pq.answers AND tta.lang=\''+learnLang+'\'');
            //SQL.join('translates.translate_t as ttan','ttan.link=pq.answers AND ttan.lang=\''+nativeLang+'\'');
        }
        SQL.whereAnd('pq.place_id='+ dataContainer.place_id);
        SQL.select(pg, cb);
    }

    self.iget = function(pg, dataContainer, cb){

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
    }

    self.ipreview = function(pg, dataContainer, cb){
        ipreview_add(pg, dataContainer,cb);
    }

    self.checkAndSetupPreview = function(pg, dataContainer, cb){
        var SQL = SL.SqlLib('pinguin.place_t', ['1']);

        SQL.whereAnd('pinguin.place_t.preview_iid='+ dataContainer.preview_iid);
        SQL.select(pg, function(err,data){
            if(err || data.length > 0){
                // place already have a image for preview
                cb(err, data);
            } else {
                // place have not any image for preview -> setup it
                ipreview_add(pg, dataContainer, cb);
            }
        });
    }

    self.idelete = function(pg, dataContainer, cb){
        idelete(pg, dataContainer, cb);
    }

    self.list = function(pg, dataContainer, cb){

        var fields = 'id'
        if(dataContainer.fields){
            fields = dataContainer.fields;
        }

        var lang = 'en';
        if(dataContainer.lang){
            lang = dataContainer.lang;
        }

        var langNative = 'en';
        if(dataContainer.langNative){
            langNative = dataContainer.langNative;
        }

        var SQL = SL.SqlLib('pinguin.place_t pp', fields);

        var indexOfName = fields.indexOf('name');
        if(indexOfName > -1){
            fields[indexOfName] = "COALESCE(ttn.data,(SELECT tte.data FROM translates.translate_t tte WHERE tte.link=pp.name AND tte.lang='en')) as name";
            SQL.join('translates.translate_t as ttn','ttn.link=pp.name AND ttn.lang=\''+lang+'\'');
        }

        var indexOfPreview = fields.indexOf('preview');
        if(indexOfPreview > -1){
            fields[indexOfPreview] = "pit.image as preview";
            SQL.join('pinguin.image_t as pit','pit.iid=pp.preview_iid');
        }

        var indexOfSize = fields.indexOf('size');
        if(indexOfSize > -1){
            fields[indexOfSize] = "pinguin.place_size(id,'"+lang+"','"+langNative+"') as size";
        }

        SQL.select(pg, cb);
    }

    self.langsAndCities = function(pg, lang, cb){
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
                    ' JOIN translates.translate_t on translates.translate_t.link=pinguin.place_t.info where translates.translate_t.lang=\''+lang.lang+'\') as cities' +
                    ',(SELECT count(*) from (SELECT count(*) from pinguin.place_t' +
                    ' join pinguin.question_t on pinguin.question_t.place_id=pinguin.place_t.id' +
                    ' join translates.translate_t on translates.translate_t.link=pinguin.question_t.question' +
                    ' where translates.translate_t.lang=\''+lang.lang+'\' group by pinguin.place_t.id) as count_question) as questions' +
                    ', \'' + lang.lang +'\' as lang'

            });

            SQL = SQL.substr(6);
            pg.query(SQL, function(err, data){

                if(data && data.rows){
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

    self.delete = function(pg, dataContainer, cb){
        if(!dataContainer.place_id){
            cb('place_id missing');
            return;
        }

        var parallel2 = []
        var watter = [];
        var parallel = [];

        var info = null;

        parallel.push(function(icb){
            idelete(pg, dataContainer, icb);
        });

        parallel.push(function(icb){
           qdelete(pg, dataContainer, icb);
        })

        watter.push(function(icb){
            async.parallel(parallel, icb);
        })

        watter.push(function(par, icb){
            var SQL = 'DELETE FROM pinguin.place_t WHERE id='+dataContainer.place_id + ' RETURNING info,name';
            pg.query(SQL, icb);
        });

        watter.push(function(info, icb){
            console.log('delete', info);
            var data = info.rows[0];
            if(data.info){
                parallel2.push(function(icb2){
                    var questionContainer = {
                        link:data.info
                    };
                    translate.delete(pg, questionContainer, icb2);
                })
            }

            if(data.name){
                parallel2.push(function(icb2){
                    var questionContainer = {
                        link:data.name
                    };
                    translate.delete(pg, questionContainer, icb2);
                })
            }

            async.parallel(parallel2, icb);

        });



        async.waterfall(watter, cb);
    }

    /**
     *
     * @param {Object} pgClient postgesql object to manage data in DB
     * @param {Object} dataContainer
     * @param {Number} dataContainer.type type of new info (City,Story,Joke,...)
     * @param {String} dataContainer.name name of new info (Prague,Zlin,Melbourne,...)
     * @param {Level~cb} cb callback
     */
    self.createInfo = function(pg, dataContainer, cb){
        if(!dataContainer.name || dataContainer.type == undefined){
            cb("dataContainer.name or dataContainer.type missing");
        }

        var parallel = [];
        var createList = [dataContainer.type];


        parallel.push(function(icb){
            var translateNameData = {
                group : LEVEL_GROUP,
                desc : dataContainer.name
            }

            translate.addtranslate(pg, translateNameData, icb);
        });

        parallel.push(function(icb){
            var translateNameData = {
                group : LEVEL_GROUP,
                desc : 'info:' + dataContainer.name
            }

            translate.addtranslate(pg, translateNameData, icb);
        });

        async.parallel(parallel, function (err, data){
            if(err) {
                cb(err);
                return;
            }

            var sql = 'INSERT INTO pinguin.place_info_t (type,name,info) VALUES ($1,$2,$3) RETURNING pi';
            pg.query(sql, [dataContainer.type, data[0].link, data[1].link], function(e1,d2){
                cb(e1, d2.rows ? d2.rows[0] : null);
            });
        });



    }

    /**
     * update info in more langs
     * @param pgClient
     * @param dataContainer {Object} update info data
     * @param dataContainer.pi {Number} id of info
     * @param dataContainer.type {Number} type of place info
     * @param dataContainer.transates {Object}
     *           { 'en' : { name : 'Prague', text : 'Capital city'}, 'cz' : {name :.... }
     * @param cb {Level~cb} callback function
     */
    self.updateInfo = function(pgClient, dataContainer, cb){
        if(!dataContainer.pi || !dataContainer.translates || typeof(dataContainer.translates) !== 'object'){
            cb('missing dataContainer.pi or dataContainer.translates')
            return;
        }



        var watter = [];
        var parallel = [];

        watter.push(function(icb){
            var SQL = new SL.SqlLib('pinguin.place_info_t',['name','info']);
            SQL.whereAnd('pi=' + dataContainer.pi);
            SQL.select(pgClient, icb);
        });

        watter.push(function(selected, icb){
            if(!selected || selected.length < 1){
                icb('info with pi (id) :' + dataContainer.pi + ' not found!');
                return;
            }

            var selectedInfo = selected[0];
            // scan languages in translates
            // update (translate) name and info
            // if is en language update also description of that
            for (var lang in dataContainer.translates) {
                // can't be like parallel.push(function(icb2){ ... }
                // because otherwise will taken just last lang
                // example if in list is 'en', 'es', 'cz' it will just use last 'cz'
                parallel.push(__generateUpdateTranslation(lang, 'name'));
                parallel.push(__generateUpdateTranslation(lang, 'info'));

                // if eng update desc for keep desc updated with english version
                if(lang == 'en'){
                    parallel.push(__generateUpdateDesc(lang, 'name'));
                    parallel.push(__generateUpdateDesc(lang, 'info'));
                }
            }

            // update type if nesesary
            if(dataContainer.type){
                parallel.push(function(icb2){
                    var SQL = SL.SqlLib('pinguin.place_info_t');
                    SQL.whereAnd('pi=' + dataContainer.pi);

                    var ud = {};
                    ud['type'] = dataContainer.type;
                    SQL.update(pgClient, ud, icb2);
                });
            }

            async.parallel(parallel, icb);

            /**
             *  generate function here for access to selectedInfo
              */
            function __generateUpdateTranslation(lang, type){
                var transData = {
                    link : selectedInfo[type],
                    data : dataContainer.translates[lang][type],
                    lang : lang
                }

                return function(icb2){
                   translate.translate(pgClient, transData, icb2) ;
                }
            }

            /**
             *  generate function here for access to selectedInfo
             */
            function __generateUpdateDesc(lang, type){
                var transData = {
                    link : selectedInfo[type],
                    desc : dataContainer.translates[lang][type]
                }

                return function(icb2){
                    translate.updatedesc(pgClient, transData, icb2) ;
                }
            }
        });

        async.waterfall(watter, cb);



    }

    /**
     * delete place info
     * @param pgClient
     * @param dataContainer {Object}
     * @param dataContainer.pi {Number} id of delete info
     * @param cb {Level~cb} callback function
     */
    self.deleteInfo = function(pgClient, dataContainer, cb){
        if(!dataContainer.pi ){
            cb('missing dataContainer.pi')
            return;
        }

        var watter = [];
        var parallel = [];
        var serial = [];

        watter.push(function(icb){
            var SQL = new SL.SqlLib('pinguin.place_info_t',['name','info']);
            SQL.whereAnd('pi=' + dataContainer.pi);
            SQL.select(pgClient, icb);
        });

        watter.push(function(selected, icb){
            if(!selected || selected.length < 1){
                icb('info with pi (id) :' + dataContainer.pi + ' not found!');
                return;
            }

            var selectedInfo = selected[0];

            // first remove info after remove translations
            // because otherwise the translation could not be deleted
            // with live relation to place_info_t
            serial.push(function(icb2){
                var sql = 'DELETE FROM pinguin.place_info_t WHERE pi=' +dataContainer.pi;
                pgClient.query(sql, icb2);
            });

            serial.push(function(icb2){

                parallel.push(function(icb3){
                    translate.delete(pgClient, {link: selectedInfo.name}, icb3);
                })

                parallel.push(function(icb3){
                    translate.delete(pgClient, {link: selectedInfo.info}, icb3);
                })

                async.parallel(parallel, icb2);
            });

            async.series(serial, icb);

        });

        async.waterfall(watter, cb);
    }

    /**
     * get place info
     * @param pgClient
     * @param dataContainer {Object}
     * @param dataContainer.pi {Number} id of info should be loaded
     * @param cb {Level~cb} callback function
     */
    self.getInfo = function(pgClient, dataContainer, cb){
        if(!dataContainer.pi ){
            cb('missing dataContainer.pi')
            return;
        }

        var watter = [];
        var parallel = [];
        var serial = [];

        watter.push(function(icb){
            var SQL = new SL.SqlLib('pinguin.place_info_t',['pi','name','info','type']);
            SQL.whereAnd('pi=' + dataContainer.pi);
            SQL.select(pgClient, icb);
        });

        watter.push(function(selected, icb){
            if(!selected || selected.length < 1){
                icb('info with pi (id) :' + dataContainer.pi + ' not found!');
                return;
            }

            var selectInfo = selected[0];

            parallel.push(function(icb2){
                var SQL = new SL.SqlLib('translates.translate_t',['data','lang']);
                SQL.whereAnd('link=' + selectInfo.name);
                SQL.select(pgClient, icb2);
            })

            parallel.push(function(icb2){
                var SQL = new SL.SqlLib('translates.translate_t',['data','lang']);
                SQL.whereAnd('link=' + selectInfo.info);
                SQL.select(pgClient, icb2);
            })


            async.parallel(parallel, function(err, translates){
                var namesAndInfos = {};

                if(!err){
                    var names = translates[0];
                    var infos = translates[1];

                    names.forEach(function(name){
                        namesAndInfos[name.lang] = {
                            name : name.data
                        };
                    })

                    infos.forEach(function(info){
                        // maybe the object wasnt created in names
                        // created it just with info
                        if(!namesAndInfos[info.lang]){
                            namesAndInfos[info.lang] = {
                                info : info.data
                            };
                        } else {
                            namesAndInfos[info.lang].info = info.data;
                        }

                    })
                }

                selectInfo.translates = namesAndInfos;
                icb(err, selectInfo);
            });
        });

        async.waterfall(watter, cb);
    }

    /**
     * get list of infos
     * @param pgClient
     * @param fields {Array}
     * @param cb
     */
    self.listInfo = function(pgClient, fields, cb){
        var indexOfName = fields.indexOf('name');
        if(indexOfName > -1){
            fields[indexOfName] = 'tl.desc as name';
        }

        var indexOfTypeName = fields.indexOf('type');
        if(indexOfTypeName > -1){
            fields[indexOfTypeName] = 'pt.name as type';
        }

        var SQL = new SL.SqlLib('pinguin.place_info_t',fields);

        if(indexOfName > -1){
            SQL.join('translates.link_t as tl','tl.link=name');
        }

        if(indexOfTypeName > -1){
            SQL.join('pinguin.place_info_type_t as pt','pt.pit=type');
        }

        SQL.select(pgClient, cb);
    }


    /**
     * get list of types for info
     * @param pgClient
     * @param fields {Array}
     * @param cb
     */
    self.listInfoTypes = function(pgClient, fields, cb){
        var SQL = new SL.SqlLib('pinguin.place_info_type_t',fields);
        SQL.select(pgClient, cb);
    };

    /**
     * Callback used in level
     * @callback Level~cb
     * @param {Object} err
     * @param {Object} success if is null, not success othervise object
     */




    return self;
})();

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

function qdelete(pg, dataContainer, cb){
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
}

function idelete(pg, dataContainer, cb){
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

    // remove preview
    series.push(function(icb){
        var SQL = SL.SqlLib('pinguin.place_t');

        // if is not specified the imageid (iid) , so going to remove all images from place
        //          -> remove from this place preview image
        // in other case if is removed just specified image
        //          -> remove this image from any places like preview
        if(!dataContainer.iid){
            SQL.whereAnd('id='+dataContainer.place_id);
        } else {
            SQL.whereAnd('preview_iid='+dataContainer.iid);
        }
        var ud = {
            'preview_iid' : null
        };
        SQL.update(pg, ud, icb);
    });

    // delete image
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
        // have to be i[1] because first is comming from remove preview
        i[1].forEach(function(image){
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
}

function ipreview_add(pg, dataContainer, cb){
    var SQL = SL.SqlLib('pinguin.place_t');
    SQL.whereAnd('id=' + dataContainer.place_id);


    var ud = {};
    ud['preview_iid'] = dataContainer.preview_iid;
    SQL.update(pg, ud, function(err, updated){
        cb(err, {preview_iid:dataContainer.preview_iid});
    });
}