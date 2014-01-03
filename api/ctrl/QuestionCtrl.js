var Async = require('async')
    ,questionEngine = require(process.cwd() + '/engine/question.js'),
    wordsEngine = require(process.cwd() + '/engine/words.js');
var pg = null;

module.exports = {

    // init
    $init : function(server, Hapi){
        pg = server.pgClient;

    },
    // get Hapi Config
    $getConfig : function(){
        return {
            auth : 'passport'
            ,params : '{params*}'

        }
    },setstate_post : function(request){


        var params = request.params.params.split('/');



        if(params.length > 2 && params[0].length > 0 && params[1].length > 0 && params[2].length > 0){
            var questionData = {
                userId : request.user.id
                //,fullName : request.user.full_name
                ,linkId: params[0]
                ,lang1 : params[1]
                ,lang2 : params[2]
                ,message : request.payload.message
            }

            if(params.length > 3){
                questionData.status = params[3];
            }

            questionEngine.changeStatus(pg, questionData, function(err, data){
                request.reply(err ? err : data);
            });


        } else {
            request.reply('format : /link/lang1/lang2/*status');
        }

    },

    /**
     * lang1/lang2/?user
     * @param request
     */
    words_get : function (request){
        var langs = request.params.params.split('/');
        if(langs && langs.length > 1) {
            var word = new wordsEngine.WORDS(pg);
            var user = false;
            if(langs.length > 2){
                user = langs[2];
                word.setUser(user);
            }

            word.addLang(langs[0]).addLang(langs[1]);

            var fields = request.query.fields.split(',') ;

            word.question(fields, user, function(err, words){
                request.reply(words);
            });
        } else {
            request.reply('format : /link/lang1/lang2/*userId_only');
        }
    },

    messages_post : function(request){

        if(request.payload.links){
            var fields = ['message'];
            if(request.query.fields){
                fields = request.query.fields.split(',') ;
            }

            questionEngine.get(pg, request.payload.links, fields, function(err, data){
                request.reply(err ? err : data);
            });
        } else {
            request.reply('links missing in payloads')
        }


    },
    setlastvisit_post : function(request){
        if(request.payload.type){
            var lastVisitData = {
                type: request.payload.type,
                usr: request.user.id
            };

            questionEngine.lastVisit(pg, lastVisitData, function(err, data){
                request.reply(err ? err : data);
            });
        } else {
            request.reply('type missing in payloads')
        }
    },
    getlastvisit_post : function(request){
        if(request.payload.type){
            var lastVisitData = {
                type: request.payload.type,
                usr: request.user.id
            };

            //question.lastVisit(pgClient, lastVisitData, function(err, data){
                request.reply({lastVisit:new Date(), cnt:5});
            //});
        } else {
            request.reply('type missing in payloads')
        }
    }
}