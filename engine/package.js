


module.exports.getPackageForUpdate = function(pg, cb){
    var sql = 'SELECT changed, lesson, lang_mask FROM update_package';
    console.log(sql);
    loadLangs(pg, function(err, langs){

        if(err){
            cb(err, langs);
            return ;
        }


        console.log('getPackageForUpdate', langs);

        pg.query(sql, function(err, update_packages){
            if(err){
                cb(err);
                return;
            }

            update_packages.rows.forEach(function(val){
                val.langs = getLanguagesFromMask(val.lang_mask, langs)
            });

            cb(err, update_packages.rows);
        });
    })

}

function getLanguagesFromMask(mask, langs){
    var res = [];

    langs.forEach(function(val, idx){
        var l = (1 << (val.lang));

        console.log('getLanguagesFromMask', mask, l, val.lang);
        if(mask & l){
            res.push(val.code);
        }
    });

    return res;
}

function loadLangs(pg, cb){
    var sql = 'SELECT ascii(lang) as lang, code FROM t_lang';

    pg.query(sql, function(err, data){
        console.log(sql , err, data.rows);
        cb(err, data ? data.rows : null);
    });
}