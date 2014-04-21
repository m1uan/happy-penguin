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
            get_get : {

                params : '{params*}'
            }, index_get : {
                auth : 'passport'
            },stat_get : {
                auth : 'passport'
            }
        }
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
    }, get_get : function(request){
        // http://localhost:8080/admin/translates/get/en/?fields=data,description,link,key
        var data = request.params.params.split('/');
        var dataContainer = {
            lang: data[0]
        };

        if(data.length > 1){
            dataContainer.page = data[1];
        } else {
            dataContainer.page = false;
        }

        var fields = ['link']
        if(request.query.fields){
            fields = request.query.fields.split(',') ;
        }

        console.log(fields, dataContainer);

        langEngine.get(pgClient, fields, dataContainer, function(err,data){
            response(request, err, {page: dataContainer.page, trans:data, lang:dataContainer.lang});
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