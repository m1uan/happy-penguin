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

    var sqlu = 'UPDATE question_t SET status=$1,changed=now() WHERE link=$2  RETURNING qid,status';
    var sqluData = [questionData.status, questionData.link];

    pg.query(sqlu, sqluData, function(err, update){
        if(err || update.rowCount > 0){
            if(!err){
                console.log('#1 ', update);
                questionData.message = GENERIC_MESSAGE;
                addQuestionMessage(pg, update.rows[0].qid, questionData, function(err, data){
                    cb(err, update ? update.rows[0] : null);
                });

                return;
            }

            cb(err, update ? update.rows[0] : null);
            return ;
        }

        var sql = 'INSERT INTO question_t (usr,link,lang1,lang2,status) VALUES ($1,$2,$3,$4,$5) RETURNING qid,status;'
        var sqlData = [questionData.userId, questionData.link, questionData.lang1, questionData.lang2, questionData.status];
        pg.query(sql, sqlData, function(err, data){
            console.log('#2', data);
            if(!err && questionData.message){
                addQuestionMessage(pg, data.rows[0].qid, questionData, function(err, message){
                    data.rows[0].qmid = message.qmid;
                    data.rows[0].message = message.message;
                    cb(err, data ? data.rows[0] : null);
                });

                return;
            }
            cb(err, data ? data.rows[0] : null);
        });
    });


}
var GENERIC_MESSAGE = ':GENERIC_MESSAGE:'

function addQuestionMessage(pg, qid, questionData, cb){
    if(!questionData.message){
        return cb(null, null);
    }


    var genericText = '';
    if(questionData.message == GENERIC_MESSAGE){
        genericText="'*note: set STATUS to: " + questionData.status + "'"
    } else {
        genericText=questionData.message;
    }

    var sqlu = 'UPDATE question_message_t SET changed=now() WHERE question=$1 AND usr=$2 AND message=$3 AND lang1=$4 AND lang2=$5 RETURNING qmid,message';
    var sqlData = [qid, questionData.userId, genericText, questionData.lang1, questionData.lang2 ];

    pg.query(sqlu, sqlData, function(err, update){
        console.log('#3', update);
        if(err || update.rowCount > 0){
            cb(err, update ? update.rows[0] : null);
            return ;
        }

        var sqli = 'INSERT INTO question_message_t (question,usr,message,lang1,lang2) VALUES ($1,$2,$3,$4,$5) RETURNING qmid,message';
        pg.query(sqli, sqlData, function(err, data){
            console.log('#4', err, data);
            cb(err, data ? data.rows[0] : null);
        });
    });
}