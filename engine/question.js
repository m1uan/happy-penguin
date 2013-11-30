var fs = require('fs'),
    words = require('./words.js'),
    Image = require('./image.js'),
    Async = require('async'),
    Config = require('../config/local.js'),
    Archiver = require('archiver'),
    SL = require('../lib/happy/sqllib.js');



module.exports.changeStatus = function(pg, questionData, cb){
    if(!questionData || !questionData.userId || !questionData.linkId || !questionData.lang1 || !questionData.lang2 ){
      return cb('questionData have to contain userId, linkId, lang1 and lang2');
    }

    if(!questionData.status){
        questionData.status = 1;
    }

    if(!questionData.message){
        questionData.message = GENERIC_MESSAGE;
    }

    var statusData = {
        status: questionData.status,
        link:questionData.linkId,
        'changed':'now()'};
    var statusReturning =  ['status','link','changed'];
    var sqlStatus = new SL.SqlLib('question_status_t');
    sqlStatus.whereAnd('link=' + questionData.linkId);
    sqlStatus.upsert(pg, statusData, statusReturning, function(errStatus, statusLink){
        statusLink = statusLink[0];
        addQuestionMessage(pg, questionData, function(errMessage, message){
            var ret = null;
            if(!errStatus && !errMessage) {
                ret = {
                    status : statusLink.status,
                    link : statusLink.link,
                    message : message.message,
                    user : message.usr,
                    changed : message.changed
                }
            }

            cb(errStatus|| errMessage, ret);
        });
    });




}
var GENERIC_MESSAGE = ':GENERIC_MESSAGE:'

function addQuestionMessage(pg, questionData, cb){
    if(!questionData.message){
        return cb(null, null);
    }


    var genericText = '';
    if(questionData.message == GENERIC_MESSAGE){
        genericText="*note: set STATUS to: " + questionData.status
    } else {
        genericText=questionData.message;
    }
    var messageData = {
        message: genericText,
        link:questionData.linkId,
        usr : questionData.userId,
        lang1 : questionData.lang1,
        lang2: questionData.lang2,
        'changed':'now()'};
    var messageReturning =  ['message','usr','changed', 'link'];
    var sqlStatus = new SL.SqlLib('question_t');
    sqlStatus.whereAnd('link=' + questionData.linkId);
    sqlStatus.whereAnd("message='" + genericText + "'");
    sqlStatus.whereAnd('usr=' + questionData.userId);
    sqlStatus.whereAnd("lang1='" + questionData.lang1+ "'");
    sqlStatus.whereAnd("lang2='" + questionData.lang2+ "'");

    sqlStatus.upsert(pg, messageData, messageReturning, function(errStatus, message){
          cb(errStatus, message ? message[0] : null) ;
    });


}