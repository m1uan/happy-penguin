var fs = require('fs'),
    words = require('./words.js'),
    Image = require('./image.js'),
    Async = require('async'),
    Config = require('../config/local.js'),
    Archiver = require('archiver'),
    SL = require('../lib/happy/sqllib.js');;

/*
    PKG_DIR = '/tmp/pkg/' in config
 */

module.exports.DIR_LANG = 'lang/';
module.exports.DIR_IMG = 'img/';
module.exports.DIR_PKG = 'pkg/';

module.exports.LANG_EXT = '.data';


module.exports.get = function(pg, langs, fields, cb){
    var parallel = [];

    langs.forEach(function(lang){
        parallel.push(function(icb){
            var sqlPackages = new SL.SqlLib('package_t');

            sqlPackages.whereAnd('lang=',lang).fields(fields).select(pg, icb);
        })
    });

    Async.parallel(parallel, function(err, params){
        if(Config.debug){
            console.log(err || params);
        }

        if(err){
            cb(err);
        } else {
            var result = {};

            langs.forEach(function(lang,idx){

                result[lang] = params[idx];
            });

            cb(err, result);
        }
    });

}


module.exports.getPackageForUpdate = function(pg, timeFrom, cb){
    var sql = 'SELECT changed, lesson, lang_mask FROM update_package_t ' +
        'WHERE lesson IS NOT NULL AND changed > $1';

    var sqlvar = [timeFrom];
    if(Config.debug){
        console.log(sql, sqlvar);
    }
    loadLangs(pg, function(err, langs){

        if(err){
            cb(err, langs);
            return ;
        }


        //console.log('getPackageForUpdate', langs);

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

// http://stackoverflow.com/questions/6953286/node-js-encrypting-data-that-needs-to-be-decrypted
module.exports.generateLangFile = function(generateData, cb){
    var file = generateData.outDir + module.exports.DIR_LANG + generateData.lang + module.exports.LANG_EXT;
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

            var crypto = require('crypto');
            console.log(crypto.getCiphers(), crypto.getHashes());

            var algorithm = 'aes128'; // or any other algorithm supported by OpenSSL
            var key = 'password';

            var cipher = crypto.createCipher(algorithm, key);
            var encrypted = cipher.update(data, 'utf8', 'binary') + cipher.final('binary');

        //console.log('to tech dat moc neni ne?', data, file);
        fs.writeFile(file, encrypted, function (err) {
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
    var copies = [];
    var files = [];
    copyImgData.images.forEach(function(image, idx)
    {
        if(image.imagefile){
            var img = image.imagefile;
            var cp = function(icb){

                var orig = Image.IMG_THUMB_DIR + img;
                var desc = copyImgData.outDir + module.exports.DIR_IMG + img;

                copyFile(orig, desc, icb);
            }

            copies.push(cp);
            files.push(img);
        }
    });

    // changed to parallel task with copy file
    // because afterEach was error with can't read file
    // randomly in source
    Async.parallel(copies, function(err){
        cb(err, err ? null : files);
    });
}





module.exports.createPackage = function(pg, lesson, cb){

    var sqlLang = 'SELECT lang FROM lang_t';
    pg.query(sqlLang, function(err, langData){
        var langs = [];

        langData.rows.forEach(function(lang){
            langs.push(lang.lang);
        });

        createOrUpdatePkg(pg, lesson, langs,  cb);

    });

}


module.exports.updatePackage = function(pg, lesson, updateLangs, cb){
    var sqlLang = 'SELECT lang FROM lang_t';
    pg.query(sqlLang, function(err, langData){
        var langs = [];

        langData.rows.forEach(function(lang){
            langs.push(lang.lang);
        });

        createOrUpdatePkg(pg, lesson,langs,  updateLangs, cb);
    });
}

module.exports.removeUpdatePackage = function(pg, lesson, cb){
    var sqladd = '';
//    updateLangs.forEach(function(lang, idx){
//        if(sqladd.length > 0){
//            sqladd += '|'
//        }
//
//        sqladd += "(select get_mask('" + lang + "'))";
//
//    });

    var sql = "DELETE FROM update_package_t WHERE lesson = $1";// and lang_mask = (" + sqladd + ")";
    pg.query(sql, [lesson], function(err, data){
        console.log(sql, [lesson], err ? err : data);
        cb(null);
    });

}

function createOrUpdatePkg(pg, lesson, langs, updateLangs, cb){
    var temp = lesson + '_'  + new Date().getTime();
    var tempDir = Config.DIR_TMP + temp + '/';
    var fileName =  temp + '.lng';

    if(!cb){
        cb = updateLangs;
        updateLangs = [];
    }

    module.exports.createPkgDirectory(tempDir, function(err){

        words.getWordsWithImages(pg, langs, lesson, function(err, words){


            var images = words[0];

            if(Config.warn && !images){
                console.log('images empty for ' + lesson);
            }

            //console.log(words);
            var asyncFuncs = [];

            // the images are in end of words list
            // but in async list have to be first
            // because zip package expecting in data list of images
            asyncFuncs.push(function(icb){
                module.exports.copyImageFiles({
                    outDir : tempDir,
                    images : images
                }, function(err, copiedFiles){
                    icb(err, copiedFiles);
                });
            });

            // but if i put to for the lang is allways the last value in list
            // for exaple list : ['ar','cs', 'ms'] ->
            // in funciton(icb) the generalData -> allways 'ms'
            function not_nice_solution(idx, fnc){
                var lng = langs[idx2];
                var generateData = {
                    outDir : tempDir,
                    lesson : lesson,
                    lang : lng,
                    words : words[idx2 + 1], // because words contain first index just link of words
                    images : images,
                    fileName : fileName,
                    update : updateLangs.indexOf(lng) != -1
                };
                return function(icb){
                    fnc(generateData, function(err){
                            icb(err);
                        },
                        // not nice solution in not nice solution -> bad solution
                        pg);
                }
            }

            for(var idx2 = 0; idx2 != words.length-1; idx2++){
                asyncFuncs.push(not_nice_solution(idx2, module.exports.generateLangFile));
                asyncFuncs.push(not_nice_solution(idx2, storeInDbPackage));
            }

            // series - posible problem with not end SQL stream
            Async.series (asyncFuncs, function(err, data){
                if(err){
                    //console.log(err);
                    cb(err);
                } else {
                    //cb(null);
                    zipPackage(Config.DIR_DATA + module.exports.DIR_PKG +fileName, tempDir, langs, data[0], cb);
                }
            });

        });
    }); // module.exports.createPkgDirectory(tempDir, function(err)


    function zipPackage(fileName, tempDir, langs, images, cb){
        //console.log('zipPackage', fileName, langs, images);

        //var output = fs.createWriteStream(__dirname + '/example-output2.zip');
        var output = fs.createWriteStream(fileName);
        var archive = Archiver('zip');

        output.on('close', function() {
            console.log('archiver has been finalized and the output file descriptor has closed. ' + fileName);
            movePackageToProductionSync(fileName);
            cleanAfterPackageSync(tempDir, langs, images);
            cb(null, fileName);
        });

        archive.on('error', function(err) {
            throw err;
        });

        archive.pipe(output);

        images.forEach(function(img){
            var imgName = module.exports.DIR_IMG +  img;
            archive.append(fs.createReadStream(tempDir + imgName), { name: imgName });
        });

        langs.forEach(function(lng){
            var langName = module.exports.DIR_LANG + lng + module.exports.LANG_EXT;
            archive.append(fs.createReadStream(tempDir +  langName), { name:  langName });
        });


        archive.finalize(function(err, bytes) {
            if (err) {
                throw err;
            }

            console.log(bytes + ' total bytes');
        });
    }

    function movePackageToProductionSync(filename){
        var productionFile = Config.DIR_DATA + module.exports.DIR_PKG + lesson + '.lng';
        var productionFileRestore =  productionFile + '_';

        var restore = false;
        if(fs.existsSync(productionFile)){
            fs.renameSync(productionFile, productionFileRestore);
            restore = true;
        }

        var rename = fs.renameSync(filename, productionFile);
        if(!rename){
            if(restore){
                fs.unlinkSync(productionFileRestore);
            }
            console.log('lesson ' + lesson + ' with file ' + productionFile + ' success');
        } else {
            fs.unlinkSync(filename);
            if(restore){
                fs.renameSync(productionFileRestore, productionFile);
            }
            console.log('sorry move package colapsed :-(', rename);
        }


    }

    function cleanAfterPackageSync(tempDir, langs, images) {

        var imageDir = tempDir + module.exports.DIR_IMG;
        var langDir = tempDir + module.exports.DIR_LANG;

        images.forEach(function(img){
            fs.unlinkSync(imageDir + img);
        });

        langs.forEach(function(lng){
            fs.unlinkSync(langDir +  lng + module.exports.LANG_EXT);
        });

        fs.rmdirSync(imageDir);
        //console.log('unlink', imageDir);
        fs.rmdirSync(langDir);
        //console.log('unlink', langDir);
        fs.rmdirSync(tempDir);
        //console.log('unlink', tempDir);
    }

}

function storeInDbPackage(generateData, cb, pg){
    var thumb = generateData.words.slice(1,10);
    //console.log('generateData.words.slice(1,30)',generateData, generateData.words, thumb);

    var wordsArray = [];
    generateData.words.forEach(function(w){
        wordsArray.push(w.word);
    });

    var words = wordsArray.join().substr(0, 255);

    var sql = 'UPDATE package_t SET examples=$1, file=$2'
    var sqlWhere =  ' WHERE lesson=$3 AND lang=$4';
    var sqlval = [words, generateData.fileName, generateData.lesson, generateData.lang];

    if(generateData.update){
        sql += ', changed=CURRENT_TIMESTAMP';
    }

    sql += sqlWhere;

    pg.query(sql, sqlval, function(err, update){
        if(Config.debug){
            console.log('storeInDbPackage', sql, sqlval, err ? err : update.rowCount);
        }
        if(!err && update.rowCount < 1){
            sql = 'INSERT INTO package_t (examples, file, lesson, lang) VALUES($1, $2, $3, $4) ';

            pg.query(sql, sqlval, function(err, insert){
                //console.log('storeInDbPackage', sql, sqlval, err? err : insert);
                cb(err);
            });


        } else {
            cb(err);
        }

    });

}





module.exports.createPkgDirectory = function(dirWhere, cb){
    fs.mkdir(dirWhere, function(){
        fs.mkdirSync(dirWhere + module.exports.DIR_LANG);
        fs.mkdirSync(dirWhere + module.exports.DIR_IMG);
        cb();
    });

}

// stolen from :
// http://stackoverflow.com/questions/11293857/fastest-way-to-copy-file-in-node-js
function copyFile(source, target, cb) {
    var cbCalled = false;
    if(Config.debug){
        console.log('copy : ', source, ' -> ', target);
    }


    var rd = fs.createReadStream(source);
    rd.on("error", function(err) {
        done(err);
    });
    var wr = fs.createWriteStream(target);
    wr.on("error", function(err) {
        done(err);
    });
    wr.on("close", function(ex) {
        done();
    });
    rd.pipe(wr);

    function done(err) {
        if (!cbCalled) {
            cb(err);
            cbCalled = true;
        }
    }
}

function getLanguagesFromMask(mask, langs){
    var res = [];

    langs.forEach(function(val, idx){
        var l = (1 << (val.code));
        if(Config.debug){
            console.log('getLanguagesFromMask', mask, l, val.lang);
        }
        if(mask & l){
            res.push(val.lang);
        }
    });

    return res;
}

function loadLangs(pg, cb){
    var sql = 'SELECT lang, code FROM lang_t';

    pg.query(sql, function(err, data){
        if(Config.debug){
            console.log(sql , err ? err : data.rows);
        }
        cb(err, data ? data.rows : null);
    });
}