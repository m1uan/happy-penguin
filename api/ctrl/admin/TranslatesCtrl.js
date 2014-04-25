var langEngine = require(process.cwd() + '/engine/translates/langs.js')
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
            auth:'passport',
            get_get : {
                auth:false,
                params : '{params*}'
            }, index_get : {
                auth : 'passport'
            },stat_get : {
                auth : 'passport'
            },import_post : {
                params : '{params*}'
            }
        }
    }, langs_get : function(request){
        var dataContainer = {
            lang_of_names :  'en'
        };

        langEngine.getlangs(pgClient, ['lang','name','translate'], dataContainer, function(err,data){
            console.log('get langs:',err, data);
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


        // http://localhost:8080/admin/translates/get/en/second/?fields=data,description,link,key&type=api&group=1
        // note : #get-type - default angular-static
        // type = angular-static - output in json for angular static
        //        api - standard output for editor
        //        csv - output in csv format with ';'
        // second : second language if is the primary not available - mostly english
        // group : specify just the group of translates




        var data = request.params.params.split('/');
        var dataContainer = {
            lang: data[0]
        };

        if(data.length > 1){
            dataContainer.second = data[1];
        }


        if(data.length > 1){
            dataContainer.page = data[1];
        } else {
            dataContainer.page = false;
        }

        // note : #get-type
        var type = 'angular-static';
        if(request.query.type){
            type = request.query.type;
        }

        var fields = ['link'];

        // angular-static have just key and data
        if(type == 'angular-static') {
            fields = ['key','data'];
        }else if(type == 'csv') {
            fields = ['link','data'];
        }else if(request.query.fields){
            fields = request.query.fields.split(',') ;
        }

        if(request.query.lastUpdateFirst && request.query.lastUpdateFirst=='true'){
           dataContainer.lastUpdateFirst = true;
        }

        if(!isNaN(request.query.group)){
            dataContainer.group = request.query.group;
        }

        console.log(fields, dataContainer);

        langEngine.get(pgClient, fields, dataContainer, function(err,data){

            if(err || type == 'api'){
                response(request, err, {page: dataContainer.page, trans:data, lang:dataContainer.lang});
            } else if(type=='csv'){
                var out = '';

                data.forEach(function(trans){
                    out += trans.link.toString() + ';'
                    + (trans.data ? trans.data : '') +"\n";
                });

                request.reply(out).type('text/plain');
            } else {
                var out = {};
                data.forEach(function(trans){
                    out[trans.key] = trans.data;
                });

                request.reply(out);
            }

        });
    },add_post : function(request){
        var dataContainer = request.payload;

        if(!dataContainer.lang){
            response(request, 'field \'lang\' missing');
            return ;
        }

        if(!dataContainer.key){
            response(request, 'field \'key\' missing');
            return ;
        }

        if(!dataContainer.desc){
            response(request, 'field \'desc\' missing');
            return ;
        }

        langEngine.addtranslate(pgClient, dataContainer, function(err,data){
             response(request, err, data);
        });
    },update_post : function(request){
        var dataContainer = request.payload;

        if(!dataContainer.lang){
            response(request, 'field \'lang\' missing!');
            return ;
        }

        if(!dataContainer.link){
            response(request, 'field \'link\' missing!');
            return ;
        }

        if(!dataContainer.data){
            response(request, 'field \'data\' missing!');
            return ;
        }

        langEngine.translate(pgClient, dataContainer, function(err,data){
            response(request, err, data);
        });
    },updatedesc_post : function(request){
        var dataContainer = request.payload;

        if(!dataContainer.key){
            response(request, 'field \'key\' missing!');
            return ;
        }

        if(!dataContainer.link){
            response(request, 'field \'link\' missing!');
            return ;
        }

        if(!dataContainer.desc){
            response(request, 'field \'desc\' missing!');
            return ;
        }

        langEngine.updatedesc(pgClient, dataContainer, function(err,data){
            response(request, err, data);
        });
    },import_post : function(request){
        console.log('req3432', request.payload);
        if(!request.payload.csv){
            response(request, 'csv missing');
            return ;
        }

        var params = request.params.params.split('/');
        var lang = params[0];

        var funcs = [];

        var lines = request.payload.csv.split('\n');
        var errorApear = lines.some(function(line, idx){
            if(line && !isBlank(line)){
                funcs.push(function(icb){


                    // issue
                    if(line.indexOf(';') < 0){
                        response(request, 'line: '+idx+' missing separator for link and data');
                        return true;
                    }

                    var linkData = line.split(';');
                    var link = parseInt(linkData[0].trim());

                    if(isNaN(link)){
                        response(request, 'line: '+idx+' link is not a number');
                        return true;
                    }

                    var data = linkData[1].trim();
                    var dataContainer = {
                        lang: lang,
                        link : link,
                        data : data
                    }

                    console.log('translate', dataContainer);

                    langEngine.translate(pgClient, dataContainer, icb);
                });
            }
        });

        if(!errorApear){
            async.parallel(funcs, function(err, data){
                response(request, err, 'ok');
            });
        }

        //
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