var fs = require('fs'),
    words = require('./words.js'),
    Image = require('./image.js');


module.exports.getPackageForUpdate = function(pg, timeFrom, cb){
    var sql = 'SELECT changed, lesson, lang_mask FROM update_package ' +
        'WHERE lesson IS NOT NULL AND changed > $1';

    var sqlvar = [timeFrom];
    console.log(sql, sqlvar);
    loadLangs(pg, function(err, langs){

        if(err){
            cb(err, langs);
            return ;
        }


        console.log('getPackageForUpdate', langs);

        pg.query(sql, sqlvar, function(err, update_packages){
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

/**
 *
 * @param generateData = {
 *    outDir : '/tmp/',
 *    lesson : 102,
 *    lang ; 'cs',
 *    words : [ list..of..words ]
 *    images : [ list..of..images ]
 * }
 *
 * @param cb - callback
 *
 *
 * FORMAT:
 * lesson;lang;num_words
 * lid1;word1;*img1
 * lid2;word2;*img2
 * lid3;word3;*img3
 */

module.exports.generateLangFile = function(generateData, cb){
    var file = generateData.outDir + generateData.lang + '.data';
    //words.getWords(pg, lang, lesson, function(words){
        var data = generateData.lesson + ';'
            + generateData.lang
            + ';' + generateData.words.length
            + '\n';

        generateData.words.forEach(function(w,idx){
           data += w.link + ";";
           data += w.word + ";";

           generateData.images.some(function(image,ii){
               if(w.link == image.lid){

                   if(image.imagefile){
                       data += image.imagefile;
                   }


                   return;
               }
           });

           data += "\n";
        });

        console.log(data);
        fs.writeFile(file, data, function (err) {
           cb(err);
        });

    //});
}

/**
 *
 * @param copyImgData = {
 *    outDir : '/tmp/',
 *    images : [ list..of..images ]
 * }
 *
 * @param cb - callback
 *
 */

module.exports.copyImageFiles = function(copyImgData, cb){
    copyImgData.images.forEach(function(image, idx)
    {
        if(image.imagefile){
            var orig = Image.IMG_THUMB_DIR + image.imagefile;
            var desc = copyImgData.outDir + image.imagefile;
            console.log('copy : ', orig, ' -> ', desc);
            fs.createReadStream(orig).pipe(fs.createWriteStream(desc));
        }

    });
    cb();
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