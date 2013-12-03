var Async = require('async')
    ,packageEngine = require(process.cwd() + '/engine/package.js');
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
}