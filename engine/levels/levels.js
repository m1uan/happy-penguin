var LocalStrategy = require('passport-local').Strategy,
    SL = require(process.cwd() + '/lib/happy/sqllib.js')
    , translate = require('../translates/langs.js')
    ,async = require('async');

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
                group:1000
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
    },update : function(pg, dataContainer, cb){
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


    }
}