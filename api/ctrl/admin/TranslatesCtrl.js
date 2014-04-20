var langEngine = require(process.cwd() + '/engine/translates/langs.js');
var Passport = null;
var Travelelogue = null;
var pgClient = null;

module.exports = {
    /**
     *
     * @param server
     * @param Hapi
     */
    $init : function(server, Hapi){
        Travelelogue = server.plugins.travelogue;
        pgClient = server.pgClient;
    }
    // get Hapi Config
    ,$getConfig : function(){
        return {
            auth:'passport',
            templates_get : {

                params : '{params*}'
            }, index_get : {
                auth : 'passport'
            },stat_get : {
                auth : 'passport'
            }
        }
    },templates_get : function (request){
        console.log(request.params) ;
        var template = request.params.params;

        request.reply.view('templates/' + template + '.jade', {userId:request.user.id, admin:request.user.admin == 1});
    }, langs_get : function(request){

        request.reply({'langs':['en','cz','de']});
    }, addlang_post : function(request){
        langEngine.addlang(pgClient, request, function(){

        });
    }

}