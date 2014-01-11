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
            request.reply('format : deleted[] = {n1:lang1,n2:lang2,l:#,w1:word1,w2:word2,i:image');
        } else {
            var deleteFunc = [];
            deleted.some(function(d,idx){
                if(!d.n1 || !d.n2 || !d.l || !d.w1 || !d.w2 || !d.i){
                    deleteFunc = false;
                    return true;
                }

                var deleteData = {
                    link: d.l,
                    lang1: d.n1,
                    lang2: d.n2,
                    word1: d.w1,
                    word2: d.w2,
                    image: d.i,
                    '!cnt': 'cnt + 1',
                    'changed':'now()'};

                var deleteUpdateResult = ['cnt']

                 deleteFunc.push(function(icb){
                         var sqlStatus = new SL.SqlLib('deleted_t');
                         sqlStatus.whereAnd('link=' + d.l);
                         sqlStatus.whereAnd("lang1='"+d.n1+"'");
                         sqlStatus.whereAnd("lang2='"+d.n2+"'");
                         sqlStatus.whereAnd("word1='"+d.w1+"'");
                         sqlStatus.whereAnd("word2='"+d.w2+"'");
                         sqlStatus.whereAnd("image='"+d.i+"'");
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
                request.reply('format : deleted[] = {n1:lang1,n2:lang2,l:linkId,w1:word1,w2:word2,i:image');
            }

        }


    }
}