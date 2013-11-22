var fs = require('fs'),
    words = require('./words.js'),
    Image = require('./image.js'),
    Async = require('async'),
    Config = require('../config/local.js'),
    Archiver = require('archiver');



module.exports.create = function(pg, questionData, cb){
    if(!questionData || !questionData.userId || !questionData.link || !questionData.lang1 || !questionData.lang2 ){
      return cb('questionData have to contain userId, link, lang1 and lang2');
    }

    if(!questionData.status){
        questionData.status = 1;
    }

    var sqlu = 'UPDATE question_t SET status=$1,changed=now() WHERE link=$2 AND usr=$3 RETURNING status';
    var sqluData = [questionData.status, questionData.userId, questionData.link];

    pg.query(sqlu, sqluData, function(err, update){
        if(err || update.rowCount > 0){
            cb(err, update ? update.rows[0] : null);
            return ;
        }

        var sql = 'INSERT INTO question_t (usr,link,lang1,lang2,status) VALUES ($1,$2,$3,$4,$5) RETURNING status;'
        var sqlData = [questionData.userId, questionData.link, questionData.lang1, questionData.lang2, questionData.status];
        pg.query(sql, sqlData, function(err, data){
            cb(err, data ? data.rows[0] : null);
        });
    });


}