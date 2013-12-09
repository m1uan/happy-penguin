var fs = require('fs'),
    words = require('./words.js'),
    Image = require('./image.js'),
    Async = require('async'),
    Config = require('../config/local.js'),
    Archiver = require('archiver'),
    SL = require('../lib/happy/sqllib.js');

module.exports.get = function(pg, questionData, cb){
    if(!cb){
        cb = questionData;
    }

    cb();
}

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

module.exports.get = function(pg, linkIds, cb){
    var functions = [];

    linkIds.forEach(function(linkId,idx){
        functions.push(function(icb){
            //return function(id){
                var sqlGet = new SL.SqlLib('question_t', ['message', 'lang1', 'lang2', 'usr']);
                sqlGet.whereAnd('link=', linkId);
                sqlGet.select(pg, function(err, data){
                    //console.log(data);
                    icb(err, {linkId:linkId, messages:data});
                });
            //}
        })
    });


    Async.parallel(functions, cb);

}