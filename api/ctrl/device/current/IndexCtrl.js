var Async = require('async')
    ,packageEngine = require(process.cwd() + '/engine/package.js')
    Async = require('async'),
    SL = require(process.cwd() + '/lib/happy/sqllib.js');
var pg = null;

module.exports = {

    // init
    $init : function(server, Hapi){
        pg = server.pgClient;

    },
    // get Hapi Config
    $getConfig : function(){
        return {
            params : '{params*}'

        }
    },

    /**
     * lang1/lang2/?user
     * @param request
     */
    package_get : function (request){
        var langs = request.params.params.split('/');
        if(langs && langs.length > 0) {


            var fields = ['lesson'];
            if(request.query.fields){
                fields = request.query.fields.split(',') ;
            }

            packageEngine.get(pg, langs , fields, function(err, packages){
                request.reply(packages);
            });
        } else {
            request.reply('format : /link/lang1/lang2/*langN');
        }
    }

    ,deleted_post : function(request){
        var deleted = request.payload.deleted;
        if(!deleted || !deleted.length){
            request.reply('format : deleted[] = {n1:lang1,n2:lang2,l:#,w1:word1,w2:word2,*i:image');
        } else {
            var deleteFunc = [];
            deleted.some(function(d,idx){
                if(!d.n1 || !d.n2 || !d.l || !d.w1 || !d.w2){
                    deleteFunc = false;
                    return true;
                }

                if(!d.i){
                    d.i = 'null.jpg';
                }

                var deleteData = {
                    link: d.l,
                    lang1: d.n1,
                    lang2: d.n2,
                    word1: d.w1,
                    word2: d.w2,
                    '!cnt': 'cnt + 1',
                    image : d.i,
                    'changed':'now()'};

                var deleteUpdateResult = ['cnt']

                 deleteFunc.push(function(icb){
                    var sqlStatus = new SL.SqlLib('deleted_t');
                         sqlStatus.whereAnd('link=' + d.l);
                         sqlStatus.whereAnd("lang1='"+d.n1+"'");
                         sqlStatus.whereAnd("lang2='"+d.n2+"'");
                         sqlStatus.whereAnd("word1='"+d.w1+"'");
                         sqlStatus.whereAnd("word2='"+d.w2+"'");
                     if(d.i){
                         sqlStatus.whereAnd("image='"+d.i+"'");
                     }
                         sqlStatus.upsert(pg, deleteData, deleteUpdateResult, function(errStatus, statusLink){
                            icb(errStatus, statusLink);
                         });

                 });

                return false;
            });

            if(deleteFunc){
                Async.parallel(deleteFunc, function(err, data){
                    request.reply(err ? err : data);

                });
            } else {
                request.reply('format : deleted[] = {n1:lang1,n2:lang2,l:linkId,w1:word1,w2:word2,*i:image');
            }

        }


    }


    ,scores_get : function(request){

        var langs = request.params.params.split('/');
        if(langs && langs.length > 2) {


            var sqlStatus = new SL.SqlLib('scores_t', ['scores_json']);
            sqlStatus.whereAnd('lesson=' + langs[0]);
            sqlStatus.whereAnd("lang='"+langs[1]+"'");
            sqlStatus.whereAnd("game="+langs[2]);

            sqlStatus.select(pg,  function(err, data){
                if(data.length == 0){
                    var sqlDefault = new SL.SqlLib('scores_t', ['scores_json']);
                    sqlDefault.whereAnd('lesson=-1');
                    sqlDefault.whereAnd("lang='00'");
                    sqlDefault.whereAnd("game=-1");

                    sqlDefault.select(pg,  function(errDefault, dataDefault){
                        returnScore(errDefault, dataDefault);
                    });
                } else {
                    returnScore(err, data);

                }
            });
        } else {
            request.reply({error:'format : /lesson/lang/gameId/?score=N'});
        }

        function returnScore(err, data){
            if(err){
                request.reply(err);
            } else {
                var result = {};
                result.scores = JSON.parse(data[0].scores_json);
                if(request.query.score){
                    result.position = getPossiblePosition(data[0].scores_json, request.query.score)
                }
                request.reply(result);
            }
        }


    },scoreadd_post : function(request){
        var score = request.payload.score;
        var langs = request.params.params.split('/');

        if(score && score.score && score.name ){
            var sqlStatus = new SL.SqlLib('scores_t', ['scores_json']);
            sqlStatus.whereAnd('lesson=' + langs[0]);
            sqlStatus.whereAnd("lang='"+langs[1]+"'");
            sqlStatus.whereAnd("game="+langs[2]);

            sqlStatus.select(pg,  function(err, data){
                if(data.length == 0){
                    var sqlDefault = new SL.SqlLib('scores_t', ['scores_json']);
                    sqlDefault.whereAnd('lesson=-1');
                    sqlDefault.whereAnd("lang='00'");
                    sqlDefault.whereAnd("game=-1");

                    sqlDefault.select(pg,  function(errDefault, dataDefault){
                        parseScores(request, errDefault, dataDefault);
                    });
                } else {
                    parseScores(request, err, data);
                }




            });
        } else {
            request.reply({error:'format : /lesson/lang/gameId/'});

        }

        function parseScores(request, err, data){
            console.log(err ? err : data);

            console.log('scoreadd_post:', data[0].scores_json);
            var scoresNew = addHeightScoreIntoScores(data[0].scores_json, score.score, score.name)
            sqlStatus.upsert(pg, {scores_json: JSON.stringify(scoresNew), lesson:langs[0], lang:langs[1],game:langs[2]}, ['scores_json'], function(err, updated){
                if(err) {
                    request.reply({err: err});
                } else {
                    request.reply({scores: scoresNew});
                }

            });
        }

    }
}

function getExpirationTime(){
    var notActiveTime = new Date().getTime() - 14*24*3600;// 14days back
    //var notActive = new Date().setTime(notActiveTime);
    return notActiveTime;
}

function getOutOfDate(scores_json) {
    var old = 0;

    // find oldest
    scores_json.forEach(function(score, idx){
          if(scores_json[old].time > score.time){
              old = idx;
          }
    });

    // test is out of date
    if(scores_json[old].time < getExpirationTime()) {
        return old;
    } else {
        return -1;
    }

}

module.exports.getPossiblePosition = getPossiblePosition;
function getPossiblePosition(scores_json, heightScore){
    var position = -1;
    var notActiveTime = getExpirationTime();// 14days back
    ///var notActive = new Date().setTime(notActiveTime);
    console.log('getPossiblePosition:', scores_json);
    var scores = JSON.parse(scores_json);
    var outOfDate = getExpirationTime(scores);
    scores.some(function(score, idx){
        if(heightScore > score.score){
            position = idx;
            // we found on top some one who is out of date
            // so it will be replaced
            if(outOfDate > position){
                position--;
            }
            return true;
        }

        return false;

    });

    if(position == -1 && outOfDate > -1){
        position = scores.length;
    }

    return position;
}

module.exports.addHeightScoreIntoScores = addHeightScoreIntoScores;

function addHeightScoreIntoScores(scores_json, heightScore, userName){
    var scores = [];
    var notActiveTime = getExpirationTime();
    console.log('addHeightScoreIntoScores:', scores_json);
    var pos = getPossiblePosition(scores_json, heightScore);

    scores_json = JSON.parse(scores_json);

    var outOfDatePos = getOutOfDate(scores_json);


    if(pos == scores_json.length){
        console.log('addHeightScoreIntoScores:', 1)
        pos--;

        // skip oldest
        scores_json.forEach(function(score,idx){
            if(idx != outOfDatePos){
                scores.push(score);
            }
        });
        scores.push({
            score : heightScore,
            name : userName,
            time : new Date().getTime()
        });
    } else if(pos != -1){
        console.log('addHeightScoreIntoScores:', 2, pos)

        // create new scores put hightScore to position
        scores_json.forEach(function(score,idx){


            if(scores.length <= scores_json.length && idx != outOfDatePos ){
                // no add last
                scores.push(score);
            }

            if(idx == pos){
                scores.push({
                    score : heightScore,
                    name : userName,
                    time : new Date().getTime()
                });
            }
        })
    } else {
        console.log('addHeightScoreIntoScores:', 3)
        // no changes
        scores = scores_json;
    }

    return scores;
}