var fs = require('fs'),
    words = require('./words.js'),
    Image = require('./image.js'),
    Async = require('async'),
    Config = require('../config/local.js'),
    Archiver = require('archiver');



module.exports.create = function(pg, questionData, cb){
    if(!questionData || !questionData.userId || !questionData.linkId || !questionData.lang1 || !questionData.lang2 ){
      return cb('questionData have to contain userId, linkId, lang1 and lang2');
    }

    if(!questionData.status){
        questionData.status = 1;
    }

    var sqlu = 'UPDATE link SET q_status=$1 WHERE lid=$2  RETURNING lid as link,q_status';
    var sqluData = [questionData.status, questionData.linkId];

    pg.query(sqlu, sqluData, function(err, update){
        if(err || update.rowCount > 0){
            if(!err){
                console.log('#1 ', update);
                questionData.message = GENERIC_MESSAGE;
                addQuestionMessage(pg, update.rows[0].link, questionData, function(err, data){
                    update.rows[0].message = data.message;
                    update.rows[0].qid = data.qid;
                    cb(err, update ? update.rows[0] : null);
                });

                return;
            }

            cb(err, update ? update.rows[0] : null);
            return ;
        }
    });


}
var GENERIC_MESSAGE = ':GENERIC_MESSAGE:'

function addQuestionMessage(pg, linkId, questionData, cb){
    if(!questionData.message){
        return cb(null, null);
    }


    var genericText = '';
    if(questionData.message == GENERIC_MESSAGE){
        genericText="'*note: set STATUS to: " + questionData.status + "'"
    } else {
        genericText=questionData.message;
    }

    var sqlu = 'UPDATE question_t SET changed=now() WHERE link=$1 AND usr=$2 AND message=$3 AND lang1=$4 AND lang2=$5 RETURNING qid,message';
    var sqlData = [linkId, questionData.userId, genericText, questionData.lang1, questionData.lang2 ];

    pg.query(sqlu, sqlData, function(err, update){
        console.log('#3', update);
        if(err || update.rowCount > 0){
            cb(err, update ? update.rows[0] : null);
            return ;
        }

        var sqli = 'INSERT INTO question_t (link,usr,message,lang1,lang2) VALUES ($1,$2,$3,$4,$5) RETURNING qid,message';
        pg.query(sqli, sqlData, function(err, data){
            console.log('#4', err, data);
            cb(err, data ? data.rows[0] : null);
        });
    });
}