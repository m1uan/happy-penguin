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
        var dataContainer = {
            lang_of_names :  'en'
        };

        langEngine.getlangs(pgClient, ['lang','name','translate'], dataContainer, function(err,data){
            response(request, err, {'langs':data});
        });

    }, addlang_post : function(request){
//        var dataContainer = {
//            lang :  'cz',
//            name : 'Czech',
//            lang_of_name: 'en'
//        };
        var dataContainer = request.payload;
        dataContainer.lang_of_name = 'en';

        langEngine.addlang(pgClient, dataContainer, function(err){
            response(request, err, 'ok');
        });
    }

}


function response(request, err, data){
    if(err){
        request.reply({error:err, success:-1}).code(400);
    } else {
        request.reply({success:1,error:'',response:data});
    }
}