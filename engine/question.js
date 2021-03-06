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

module.exports.get = function(pg, linkIds, fields, cb){
    var functions = [];
    var userIndex = fields.indexOf('@user');
    if(userIndex > -1){
        fields[userIndex] = 'usr.full_name as ufn,usr.name as user' ;
    }

    linkIds.forEach(function(linkId,idx){
        functions.push(function(icb){
            //return function(id){


                var sqlGet = new SL.SqlLib('question_t', fields);
                sqlGet.whereAnd('link=', linkId);
                sqlGet.addOrderBy('changed desc')
                if(userIndex > -1){
                    sqlGet.join('usr', 'usr.id=question_t.usr');
                }
                sqlGet.select(pg, function(err, data){
                    //console.log(data);
                    icb(err, {linkId:linkId, messages:data});
                });
            //}
        })
    });


    Async.parallel(functions, cb);

}


module.exports.lastVisit = function(pg, lastVisitData, cb){
    var sql = new SL.SqlLib('last_visit_t');
    sql.whereAnd('usr='+lastVisitData.usr);
    sql.whereAnd('type='+lastVisitData.type);

    lastVisitData.datetime = 'now()';

    sql.upsert(pg, lastVisitData, cb);
}

module.exports.LAST_VISIT_QUESTION = 1;
module.exports.LAST_VISIT_MY_QUESTION = 2;

module.exports.countChangesFromLastVisit = function(pg, lastVisitData, cb){
    var sqllastvisit = new SL.SqlLib('last_visit_t');
    sqllastvisit.whereAnd('usr='+lastVisitData.usr);
    sqllastvisit.whereAnd('type='+lastVisitData.type);

    //lastVisitData.datetime = 'now()';
    var date = new Date(0);
    sqllastvisit.select(pg, function(err, lastvisit){
        if(lastvisit && lastvisit.length > 0){
            date = lastvisit[0].datetime;
        }

        console.log('ahoj', lastvisit, date);
        if(lastVisitData.type == module.exports.LAST_VISIT_QUESTION){
            countMessages(date);
        } else if(lastVisitData.type == module.exports.LAST_VISIT_MY_QUESTION) {
            countMessageWhereIAm(date);
        }  else {
            cb('unknow type ('+lastVisitData.type+')');
        }


    });

    function countMessageWhereIAm(date){
        var sqlmyquestions = new SL.SqlLib('question_t',['link']);
        sqlmyquestions.whereAnd('usr='+lastVisitData.usr);
        sqlmyquestions.addGroupBy('link');
        sqlmyquestions.select(pg, function(err, countofvisit){
            var linkIds = [];
            if(countofvisit && countofvisit.length > 0){
                countofvisit.forEach(function(row){
                   linkIds.push(row.link);
                });
            }
            countMessages(date, true, linkIds);
        });
    }

    function countMessages(date, olnyWhereIAm, linkIds){
        var sqlcount = new SL.SqlLib('question_t',['count(*) as cnt']);
        sqlcount.whereAnd('usr<>'+lastVisitData.usr);
        sqlcount.whereAnd('changed>',date);

        if(olnyWhereIAm){
            sqlcount.whereIn('link',linkIds);
        }

        sqlcount.select(pg, function(err, countofvisit){
            var outdata = {
                lastVisit : date
            };

            if(countofvisit && countofvisit.length > 0){
                outdata.cnt = countofvisit[0].cnt
            }

            cb(err, outdata);
        });
    }
}