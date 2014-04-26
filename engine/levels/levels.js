var LocalStrategy = require('passport-local').Strategy,
    SL = require(process.cwd() + '/lib/happy/sqllib.js')
    , translate = require('../translates/langs.js')
    ,async = require('async');

var LEVEL_GROUP = 1000;

module.exports = {
    initialize : function(server, Passport) {

    },create: function(pg, dataContainer, cb){
        if(!dataContainer.posx || !dataContainer.posy || !dataContainer.name){
            cb('missing position posx, posy or/and name');
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
            var sql = 'INSERT INTO pinguin.place_t (posx,posy,name) VALUES ($1,$2,$3) RETURNING id,posx,posy';


            pg.query(sql, [dataContainer.posx,dataContainer.posy, addtranslate.link], function(err, place){
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
    }
}

function updateTextField(pg, dataContainer, type, cb){
    if(!dataContainer.id){
        cb('missing field id!');
    }
    if(!dataContainer.text){
        cb('missing field '+type+'!');
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
function updateDescAndTranslate(pg, dataContainer, cb){
    var parallel = [];

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