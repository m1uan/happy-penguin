/**
 * Created by milan on 10/21/13.
 */
var config = require('../config/local.js'),
    fs = require('fs')
    , im = require('imagemagick')
    , async = require('async');

// https://github.com/bruce/node-temp/blob/master/lib/temp.js
var generateName = function(rawAffixes, defaultPrefix) {
    //var affixes = parseAffixes(rawAffixes, defaultPrefix);
    var now = new Date();
    var name = [
        now.getYear(), now.getMonth(), now.getDate(),
        '-',
        process.pid,
        '-',
        (Math.random() * 0x100000000 + 1).toString(36),
        ].join('');
    return config.DIR_TMP + name;
}

module.exports.saveFromUrl = function(pgClient, userId, url, cb){
    var http = require('http');

    var tempName = generateName()  +'.png';
    console.log(tempName);
    var file = fs.createWriteStream(tempName);

    var request = http.get(url, function(response) {
        response.pipe(file);
        prepareImage(tempName ,cb);
    });

};


function prepareImage(fileName, cb){

    function identify(icb){
        im.identify(fileName, function(err, metadata){
            if (err) throw err;
            console.log(metadata);
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
                icb(null);
            });

        });
    }


    async.waterfall([
        identify
        , crop
        , resize
    ],cb);



}