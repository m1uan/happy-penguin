var fs = require('fs'),
    words = require('./words.js'),
    Image = require('./image.js'),
    Async = require('async'),
    Config = require('../config/local.js'),
    Archiver = require('archiver');

/*
    PKG_DIR = '/tmp/pkg/' in config
 */

module.exports.DIR_LANG = 'lang';
module.exports.DIR_IMG = 'img';

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
    var copies = [];
    var files = [];
    copyImgData.images.forEach(function(image, idx)
    {
        if(image.imagefile){
            var img = image.imagefile;
            var cp = function(icb){

                var orig = Image.IMG_THUMB_DIR + img;
                var desc = copyImgData.outDir + img;

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
    var temp = new Date().getTime();
    var tempDir = Config.DIR_TMP + temp + '/';
    var fileName = lesson + '_'  + temp + '.lng';


    var sqlLang = 'SELECT code FROM t_lang';
    pg.query(sqlLang, function(err, langData){
        var langs = langData.rows;
        console.log('langs', langs);


        module.exports.createPkgDirectory(tempDir, function(err){

        words.getWordsWithImages(pg, langs, lesson, function(err, words){
            var images = words[words.length-1];

            var asyncFuncs = [];

            for(var idx = 0; idx != words.length - 1; idx++){
                var generateData = {
                    outDir : tempDir,
                    lesson : lesson,
                    lang : langs[idx],
                    words : words[idx],
                    images : images
                };

                // the images are in end of words list
                // but in async list have to be first
                // because zip package expecting in data list of images
                if(idx == 0){
                    asyncFuncs.push(function(icb){
                        module.exports.copyImageFiles(generateData, function(err){
                            icb(err);
                        });
                    });
                }

                asyncFuncs.push(function(icb){
                    module.exports.generateLangFile(generateData, function(err){
                        icb(err);
                    });
                });

            }

            Async.parallel(asyncFuncs, function(err, data){
                if(err){
                    cb(err);
                } else {
                    console.log('Async.parallel(asyncFuncs, function(err, data)', data);
                    zipPackage(fileName, tempDir, langs, data[0], cb);
                }
            });

        });
        }); // module.exports.createPkgDirectory(tempDir, function(err)
    });

}

function zipPackage(fileName, tempDir, langs, images, cb){
    var output = fs.createWriteStream(__dirname + '/example-output.zip');
    var archive = Archiver('zip');

    output.on('close', function() {
        console.log('archiver has been finalized and the output file descriptor has closed.');
        cb(null, fileName);
    });

    archive.on('error', function(err) {
        throw err;
    });

    archive.pipe(output);

    archive.finalize(function(err, bytes) {
        if (err) {
            throw err;
        }

        console.log(bytes + ' total bytes');
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
    console.log('copy : ', source, ' -> ', target);

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