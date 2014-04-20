var userEngine = require(process.cwd() + '/engine/user.js');
var Passport = null;
var Travelelogue = null;

module.exports = {
    /**
     *
     * @param server
     * @param Hapi
     */
    $init : function(server, Hapi){
        Travelelogue = server.plugins.travelogue;

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
        request.reply('ok');
    }

}