/**
 * Created by milan on 10/21/13.
 */
var config = require('../config/local.js'),
    fs = require('fs')
    , im = require('imagemagick')
    , async = require('async')
    , link = require('./link.js');


var PUBLIC_DIR = config.DIR_DATA + ''
module.exports.IMG_THUMB_DIR = PUBLIC_DIR + 'img/'
module.exports.IMG_ORIG_DIR = PUBLIC_DIR + 'orig/'
/**
 *  config/local:
 *      imagemagick: true/false - switch on of imagemagick transformation
 *      PUBLIC_DIR: public dir with images
 *      TMP_DIR: public dir with temp
  */


// https://github.com/bruce/node-temp/blob/master/lib/temp.js
var generateName = function(userId, defaultPrefix) {
    //var affixes = parseAffixes(rawAffixes, defaultPrefix);
    var now = new Date();
    var name = [
        //now.getYear(), now.getMonth(), now.getDate(),
        now.getTime(),
        '-',
        process.pid,
        '-',
        (Math.random() * 0x100000000 + 1).toString(36),
        ].join('');
    return name;
}

var generateNameInTemp = function(){
    var name = config.DIR_TMP + generateName();
    //console.log(name)  ;
    return name;
}

/* { url: 'https://encrypted-tbn3.gstatic.com/images?q=tbn:ANd9GcQkNkSkn_H8K8wG_yhfljXY_jKM_ezbE7pZo5jwHj08-5vhxSBT',
link: 2001 }
storeUrl /tmp/113928-31024-68vjv7.png
end of pipe
resizeImage
identify/tmp/113928-31024-68vjv7.png
resizeImage:end
resizeImage:end
Debug: hapi, uncaught, handler, error TypeError: No srcPath or data defined
at Object.exports.crop (/var/lib/openshift/525d8b535973caad560002dc/app-root/runtime/repo/node_modules/imagemagick/imagemagick.js:280:11)
at crop (/var/lib/openshift/525d8b535973caad560002dc/app-root/runtime/repo/engine/image.js:229:12)
at fn (/var/lib/openshift/525d8b535973caad560002dc/app-root/runtime/repo/node_modules/async/lib/async.js:579:34)
at Object._onImmediate (/var/lib/openshift/525d8b535973caad560002dc/app-root/runtime/repo/node_modules/async/lib/async.js:495:34)
at processImmediate [as _immediateCallback] (timers.js:317:15)
*/

module.exports.saveFromUrl = function(pgClient, userId, linkId, url, cb){

    module.exports.storeUrl(pgClient, userId, url, function(err, imageData){
        if(err){
            cb(err, null);
        } else {
            var linkConteiner = {
                image : imageData.iid,
                lid : linkId};
            //console.log(linkConteiner);
            link.updateAndGet(pgClient,userId, linkConteiner, cb);
        }

    });
}

/**
 *
 * @param pgClient
 * @param userId
 * @param imageInfo
 * @param thumb Integer => store this image like thumbmail of link
 * @param cb
 */
module.exports.storeImgFromData = function(pgClient, userId, imageInfo, cb){




    if(imageInfo.file && imageInfo.type){
        var tempFileName = config.DIR_TMP + generateName(userId);
        writeToFile(tempFileName, imageInfo.file, function(err){
            var imageInfoNew = {
                file : tempFileName,
                type : imageInfo.type
            };
            module.exports.storeImgFromFileName(pgClient, userId, imageInfoNew, function(err, data){
                // if also there thumbData
                if(!err && imageInfo.thumbData){
                    console.log('storeImgFromData', '@ALSO THUMB',data);
                    writeThumb(imageInfo.thumbData, data.image, data.iid, function(err, thumb){
                        var res = {image: data.image, thumb: thumb, iid :data.iid};
                        cb(err, res)
                    });

                } else {
                    cb(err, data);
                }

            });
        });
    } else if(imageInfo.thumbData && imageInfo.thumbFor){
        /**
         * STORE THUMB ONLY
         */
        var sql = 'SELECT image FROM image WHERE iid = $1';
        var sqlData = [imageInfo.thumbFor];
        //console.log('storeImgFromData', '@STORE THUMB ONLY', sql, sqlData)
        pgClient.query(sql, sqlData, function(err, data){
            //console.log('storeImgFromData', 'query', err, data);
            var row0 = data.rows[0];
            writeThumb(imageInfo.thumbData, row0.image, row0.iid, function(err){
                var res = {image: row0.image, thumb: row0.image, iid : imageInfo.thumbFor};
                console.log(res)
                cb(err, res) ;
            });
        });
    } else {
        cb('imageInfo missing file and type '
            + 'or thumbData and thumbType and thumbFor ');
    }

    function writeToFile(fileName, dataForBuffer, icb) {
        console.log('storeImgFromData.writeTo', fileName);
        fs.writeFile(fileName, new Buffer(dataForBuffer, "base64"), icb);
    }

    function writeThumb(thumbData, thumbName, thumbFor, icb){

            var thumbFilePath = module.exports.IMG_THUMB_DIR + thumbName;
            writeToFile(thumbFilePath, thumbData, function(err){
                var sql = 'UPDATE image SET thumb=$1 WHERE iid = $2';
                pgClient.query(sql, [thumbName, thumbFor], function(err){

                    icb(err, thumbName);
                });

            });

    }
}

module.exports.storeImgFromFileName = function(pgClient, userId, imageInfo, cb){


    async.waterfall([
        function(icb){
            icb(null, imageInfo.file);
        },resizeImage
        , countMD5AndCopy
        , storeInDb
    ]
        ,cb);


    function storeInDb(imgFile, mdSum, icb){
        console.log('storeInDb',imgFile, mdSum );

        // NO STORE because already exists image with this md5sum
        if(!icb){
            // imgFile - cointains id of IMAGE
            mdSum(null, imgFile);
            return;

            // SKIP INSERT - because already
        }


        var sql = 'INSERT INTO image (image, md5, usr) VALUES ($1,$2,$3) RETURNING iid';
        console.log(sql);
        console.log(imgFile);
        pgClient.query(sql,[imgFile, mdSum, userId], function(err, data){
            if(err){
                icb(err, null);
                return;
            }

            console.log(data);
            // RETURN new id of image
            icb(null, {image: imgFile, iid: data.rows[0].iid});
        });

    }

    function isExistsSameImgWithMD5(md5, icb){
        var sql = 'SELECT iid, image FROM image WHERE md5 = $1';

        var data  = [md5];
        console.log(sql, data);
        pgClient.query(sql, data, function(err, rows){



            if(err){
                console.log('E isExistsSameImgWithMD5 ', err);
                icb(err, null);
                return;
            }


            console.log('LENGTH isExistsSameImgWithMD5', rows.rows.length);

            if(rows.rows.length < 1){
                icb(err, -1);
            } else {
                icb(err, {image: rows.rows[0].image, iid: rows.rows[0].iid});
            }

        });

    }

    function countMD5AndCopy(resizedFile, icb){
        var crypto = require('crypto');
        var md5sum = crypto.createHash('md5');


        var data = fs.readFile(resizedFile, function(err, data){
            md5sum.update(data);
            var sum = md5sum.digest('hex');
            console.log('countMD5AndCopy', sum);
            isExistsSameImgWithMD5(sum, function(err, imageID){
                if(err){
                    icb(err, null);
                    return;
                }

                if(imageID > 0){
                    console.log(imageID);
                    // image with this md5 exists use his id
                    icb(false, imageID);

                    // dont copy the file
                    return;
                }

                // copy
                var writeFileName = generateName();

                if(imageInfo.type == 'data:image/png'){
                    writeFileName += '.png';
                } else {
                    writeFileName += '.jpeg';
                }

                var writeFile = module.exports.IMG_ORIG_DIR +writeFileName;
                console.log('countMD5AndCopy before wrote:', writeFile) ;
                fs.writeFile(writeFile, data, function(err){
                    // create new image in DB with file name and md5
                    icb(err, writeFileName, sum);
                });
            });


        });
    }
}

module.exports.storeUrl = function(pgClient, userId, url, cb){
    var http;
    if(url.indexOf('http:') == 0) {
        http = require('http');
    } else if(url.indexOf('https:') == 0) {
        http = require('https');
    } else {
        cb('error: url must start with \'http:\' or \'https:\'', false);
    }

    var imageInfo = { };

    var endOf = '.png';
    // endsWith
    if(url.indexOf(endOf, url.length - endOf.length) !== -1){
        imageInfo.type = 'data:image/png';
    } else {
        imageInfo.type = 'data:image/jpeg';
        endOf = '.jpg';
    }


    imageInfo.file = generateNameInTemp()  + endOf;


    console.log('storeUrl', imageInfo);
    var file = fs.createWriteStream(imageInfo.file);
    file.on('close', function(){
        console.log('end of pipe')
        module.exports.storeImgFromFileName(pgClient, userId, imageInfo, cb)
    });

    try {
        var request = http.get(url, function(response) {


            process.on('uncaughtException', function (err) {
                console.log(err);
            })

            response.pipe(file);
        });
    } catch (err) {
        // handle the error safely
        console.log('storeUrl', err);
        cb(err) ;
    }
};





function resizeImage(fileName, cb){
    console.log('resizeImage', fileName);

    if(typeof config.imagemagick === 'undefined' || config.imagemagick){
        async.waterfall([
            identify
            , crop
            , resize
        ],cb);
    } else {
        cb(null, fileName);
    }

    function identify(icb){
        console.log('identify' + fileName)  ;
        im.identify(fileName, function(err, metadata){
            console.log('resizeImage:end');

            // download file isn't image
            if (err) {
                //throw err;
                icb(err, null);
                return ;
            }
            console.log('resizeImage:end');
            icb(null, metadata);
        });
    }

    function crop(metadata, icb){
        /// make quadratic
        var width = metadata.width < metadata.height ? metadata.width : metadata.height;
        var height = metadata.width < metadata.height ? metadata.width : metadata.height;

        var newFile = metadata.artifacts.filename + '.crop';

        im.crop({
            srcPath: metadata.artifacts.filename,
            dstPath: newFile,
            width: width,
            height: height,
            quality: 1,
            gravity: "Center"
            , format: 'png'
        }, function(err){
            icb(null, newFile, metadata);
        });
    }

    function resize(newFile, metadata,icb){
        var resizedFile = newFile + 'resize.png';
        im.resize({
            srcPath: newFile,
            dstPath: resizedFile,
            width:   128
            ,height:   128
        }, function(err, stdout, stderr){
            if (err) throw err;
            im.identify(resizedFile, function(err, metadata){
                console.log(metadata);
                icb(null, resizedFile);
            });

        });
    }




      //cb() ;

}