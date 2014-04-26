var levelEngine = require(process.cwd() + '/engine/levels/levels.js')
    ,async = require('async');
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
            auth:'passport'

        }
    },
    create_post: function(request){

        response(request, null, {id:1});
    }

}





function isBlank(str) {
    return (!str || /^\s*$/.test(str));
}

function response(request, err, data){
    if(err){
        request.reply({error:err, success:-1}).code(400);
    } else {
        request.reply({success:1,error:'',response:data});
    }
}