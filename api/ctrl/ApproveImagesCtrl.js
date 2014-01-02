var wordsEngine = require(process.cwd() + '/engine/words.js')
    ,async = require('async'),
    Hapi = require('hapi')
    ,Link = require(process.cwd() + '/engine/link.js');;

var pgClient = null;

module.exports = {

    // init
    $init : function(server, Hapi){
        pgClient = server.pgClient;

    },
    // get Hapi Config
    $getConfig : function(){
        return {
            auth : 'passport'
            ,params : '{params*}'
            ,test_get : {
                auth : false
            },words_get : {
                params : '{params*}'
            }
        }
    },
    test_get : function(request){
      request.reply('heelo');
    },words_get : function (request){
        var langs = request.params.params.split('/');
        if(langs && langs.length > 1) {
            var word = new wordsEngine.WORDS(pgClient);
            var user = false;

            var flag = 0;
            if(langs.length > 2){
                user = langs[2];
                word.setUser(user);
                flag = -1;
            }

            word.addLang(langs[0]).addLang(langs[1]);

            var fields = request.query.fields.split(',') ;

            word.approveImages(fields, flag, function(err, words){
                request.reply(words);
            });
        } else {
            request.reply('format : /lang1/lang2/*userId_only');
        }
    }, approve_post : function(request){
        console.log(request.payload);

        var linkData = {
            linkId : request.payload.linkId,
            flag : request.payload.flag
        };

        Link.approveLink(pgClient, linkData, function(err, data){
            request.reply(err || data);
        } );
    }

}

function err_response(request, err){
    var error = Hapi.error.badRequest(err);
    error.reformat();
    request.reply(error);
}
