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
                console.log(err ? err : data);
                var result = data[0];
                result.position = -1;

                if(request.query.score){


                    result.position = getPossiblePosition(result.scores_json, request.query.score)


                }

                request.reply(result);
            });

//            var fields = ['lesson'];
//            if(request.query.fields){
//                fields = request.query.fields.split(',') ;
//            }
//
//            packageEngine.get(pg, langs , fields, function(err, packages){
//                request.reply(packages);
//            });
        } else {
            request.reply({error:'format : /lesson/lang/gameId/?score=N'});
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
                console.log(err ? err : data);
                console.log('scoreadd_post:', data[0].scores_json);
                var scoresNew = addHeightScoreIntoScores(data[0].scores_json, score.score, score.name)
                sqlStatus.update(pg, {scores_json: scoresNew}, function(err, updated){
                    if(err) {
                        request.reply({err: err});
                    } else {
                        request.reply({scores: scoresNew});
                    }

                });



            });
        } else {
            request.reply({error:'format : /lesson/lang/gameId/'});

        }
    }
}

function getPossiblePosition(scores_json, heightScore){
    var position = -1;
    var notActiveTime = new Date().getTime() - 14*24*3600;// 14days back
    var notActive = new Date().setTime(notActiveTime);
    console.log('getPossiblePosition:', scores_json);
    var scores = JSON.parse(scores_json);

    scores.some(function(score, idx){
        if(heightScore > score.score){
            position = idx;
            return true;
        } else if(score.time < notActiveTime) {
            position = scores.length;

        }

        return false;

    });

    return position;
}


function addHeightScoreIntoScores(scores_json, heightScore, userName){
    var scores = [];
    console.log('addHeightScoreIntoScores:', scores_json);
    var pos = getPossiblePosition(scores_json, heightScore);
    scores_json = JSON.parse(scores_json);
    if(pos == scores.length){
        pos--;
        // check oldest
        scores_json.forEach(function(score,idx){
            if(scores_json[pos].time < score.time){
                pos = idx;
            }
        });
        // skip oldest
        scores_json.forEach(function(score,idx){
            if(idx != pos){
                scores.push(score);
            }
        });
    } else if(pos != -1){
        // create new scores put hightScore to position
        scores_json.forEach(function(score,idx){
            if(idx == pos){
                scores.push({
                    score : heightScore,
                    name : userName,
                    time : new Date().getTime()
                });
            }

            // no add last
            if(idx < scores_json.length -1 ){
                scores.push(score);
            }
        })
    } else {
        // no changes
        scores = scores_json;
    }

    return scores;
}