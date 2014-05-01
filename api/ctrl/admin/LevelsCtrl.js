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
            auth:'passport',
            get_get : {
                auth:false,
                params : '{params*}'
            }
        }
    },
    create_post: function(request){
        var dataContainer = request.payload;

        levelEngine.create(pgClient,dataContainer, function(err, created){
            response(request, err, created);
        });
    },update_post: function(request){
        var dataContainer = request.payload;

        var ret = function(err, created){
            response(request, err, created);
        };

        var updated = [];

        if(dataContainer.posx || dataContainer.posy){
            updated.push(function(icb){
                levelEngine.updatepos(pgClient,dataContainer, icb);
            });

        }

        if(dataContainer.name){
            updated.push(function(icb){
                levelEngine.updatename(pgClient,dataContainer, icb);
            });
        }

        if(dataContainer.info){
            updated.push(function(icb){
                levelEngine.updateinfo(pgClient,dataContainer, icb);
            });
        }

        // i know strange behave but i have not better idea now...
        if(updated.length>0){
            async.parallel(updated, function(err, updatedArray){
                var retData = null;
                if(updatedArray && updatedArray.length>0){
                    retData = {};
                    updatedArray.forEach(function(ud){
                        if(ud.posx) retData.posx = ud.posx;
                        if(ud.posy) retData.posy = ud.posy;
                        if(ud.name) retData.name = ud.name;
                        if(ud.info) retData.info = ud.info;
                        if(ud.id) retData.id = ud.id;
                    })
                }
                response(request, err, retData);
            })
        } else {
            response(request, 'update can be just posx,posy,name,info...');
        }

    },
    get_get: function(request){
        var data = request.params.params.split('/');
        var dataContainer = {
            id: data[0]
        };

        if(data.length > 1){
            dataContainer.lang = data[1];
        }

        if(data.length > 2){
            dataContainer.qlang = data[2];
        }


        if(request.query.fields){
            dataContainer.fields = request.query.fields.split(',') ;
        }

        if(request.query.qfields){
            dataContainer.qfields = request.query.qfields.split(',') ;
        }

        if(request.query.ifields){
            dataContainer.ifields = request.query.ifields.split(',') ;
        }

        levelEngine.get(pgClient, dataContainer, function(err, getData){
            response(request, err, getData);
        });
    },qadd_post : function(request){
        levelEngine.qadd(pgClient, request.payload, function(err, data){
            response(request, err, data);
        });
    },qupdate_post : function(request){
        levelEngine.qupdate(pgClient, request.payload, function(err, data){
            response(request, err, data);
        });
    },qdelete_post : function(request){
        levelEngine.qdelete(pgClient, request.payload, function(err, data){
            response(request, err, data);
        });
    },uploadimg_post : function (request){
        var image = require(process.cwd() + '/engine/image.js');

        console.log('payload', request.payload.link);


        var dataInfo = {
            file : request.payload.file,
            type : request.payload.type

        };


        // must be specified image for which imageId
        if(request.payload.thumbFor){
            dataInfo.thumbFor = request.payload.thumbFor;
        }

        if(request.payload.thumbData){
            dataInfo.thumbData = request.payload.thumbData;
        }

        var dataExtra = {
            tableName : 'pinguin.image_t',
            usrField : 'place_id',
            fileNamePrefix : 'place/',
            skipMD5Identity : true
        };

        image.storeImgFromData(pgClient, request.payload.link, dataInfo, function(err, imageData){
                response(request, err, imageData);

        },dataExtra);

    },idelete_post: function(request){
        if(!request.payload.place_id){
            response(request,'place_id missing');
            return;
        }
        if(!request.payload.iid){
            response(request,'iid missing');
            return;
        }


        var dataContainer = {
            place_id :request.payload.place_id,
            iid : request.payload.iid
        }

        levelEngine.idelete(pgClient, dataContainer, function(err, deleted){
            response(request, err, deleted);
        });
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