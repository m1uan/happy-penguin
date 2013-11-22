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
    var sql = 'INSERT INTO question_t (usr,link,lang1,lang2) VALUES ($1,$2,$3,$4);'
    var sqlData = [questionData.userId, questionData.link, questionData.lang1, questionData.lang2];
    pg.query(sql, sqlData, function(err, data){
        cb(err, data ? data.rows : null);
    });
}