var levelEngine = require(process.cwd() + '/engine/levels/levels.js')
    ,async = require('async');
var Passport = null;


module.exports = (function(){

    var Travelelogue = null;
    var pgClient = null;
    var self = {};

    /**
     *
     * @param server
     * @param Hapi
     */
    self.$init = function(server, Hapi){
        Travelelogue = server.plugins.travelogue;
        pgClient = server.pgClient;
    }
    // get Hapi Config
    self.$getConfig = function(){
        return {
            auth:'passport',
            get_get : {
                auth:false,
                params : '{params*}'
            },list_get : {
                auth:false,
                params : '{params*}'
            }
        }
    }
    self.create_post= function(request){
        var dataContainer = request.payload;

        levelEngine.create(pgClient,dataContainer, function(err, created){
            response(request, err, created);
        });
    }
    self.update_post= function(request){
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

        if(dataContainer.place_info){
            updated.push(function(icb){
                levelEngine.updateinfo(pgClient,dataContainer, icb);
            });
        }
        // all included in place_info
        /*if(dataContainer.name){
            updated.push(function(icb){
                levelEngine.updatename(pgClient,dataContainer, icb);
            });
        }*/

        /*if(dataContainer.info){
            updated.push(function(icb){
                levelEngine.updateinfo(pgClient,dataContainer, icb);
            });
        }*/

        // i know strange behave but i have not better idea now...
        if(updated.length>0){
            async.parallel(updated, function(err, updatedArray){
                var retData = null;
                if(updatedArray && updatedArray.length>0){
                    retData = {};
                    updatedArray.forEach(function(ud){
                        if(ud.posx) retData.posx = ud.posx;
                        if(ud.posy) retData.posy = ud.posy;
                        /*if(ud.name) retData.name = ud.name;
                        if(ud.info) retData.info = ud.info;*/
                        if(ud.place_info) retData.place_info = ud.place_info;
                        if(ud.id) retData.id = ud.id;
                    })
                }
                response(request, err, retData);
            })
        } else {
            response(request, 'update can be just posx,posy,name,info...');
        }

    }
    self.get_get= function(request){
        var data = request.params.params.split('/');
        var dataContainer = {
            id: data[0]
        };

        if(data.length > 1){
            // first is learn language
            dataContainer.lang = data[1];
        }

        if(data.length > 2){
            // second is native language
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
    }
    self.qadd_post = function(request){
        levelEngine.qadd(pgClient, request.payload, function(err, data){
            response(request, err, data);
        });
    }
    self.qupdate_post = function(request){
        levelEngine.qupdate(pgClient, request.payload, function(err, data){
            response(request, err, data);
        });
    }
    self.qdelete_post = function(request){
        levelEngine.qdelete(pgClient, request.payload, function(err, data){
            response(request, err, data);
        });
    }
    self.uploadimg_post = function (request){
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
            // after upload image try registred like preview
            imageSetupPreviewAndResponse(request, err, imageData, request.payload.link, pgClient);
        },dataExtra);

    }
    self.saveimgurl_post = function(request){
        console.log(request.payload);
        var imageEngine = require(process.cwd() + '/engine/image.js');
        var updateImg = request.payload;


        var dataExtra = {
            tableName : 'pinguin.image_t',
            usrField : 'place_id',
            fileNamePrefix : 'place/',
            skipMD5Identity : true
        };

        var userId = request.user.id;

        imageEngine.storeUrl(pgClient, request.payload.link, updateImg.url, function(err, data){
            // after upload image try registred like preview
            imageSetupPreviewAndResponse(request, err, data, request.payload.link, pgClient);
        }, dataExtra);
    }
    self.idelete_post = function(request){
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
    self.list_get= function(request){


        var data = request.params.params.split('/');
        var dataContainer = {
            lang: data[0],
            langNative : data[1]
        };


        if(request.query.fields){
            dataContainer.fields = request.query.fields.split(',') ;
        }

        if(!dataContainer.lang){
            response(request,'lang missing (list/lang/)');
            return;
        }

        levelEngine.list(pgClient, dataContainer, superResponse(request));
    }
    self.delete_post= function(request){
        if(!request.payload.place_id){
            response(request,'place_id missing');
            return;
        }

        var dataContainer = {
            place_id :request.payload.place_id
        }

        levelEngine.delete(pgClient, dataContainer, function(err, deleted){
            response(request, err, deleted);
        });
    }
    self.deleteinfo_post= function(request){
        if(!request.payload.id){
            response(request,'id of place missing');
            return;
        }

        var dataContainer = {
            id :request.payload.id
        }

        levelEngine.deleteinfo(pgClient, dataContainer, function(err, deleted){
            response(request, err, deleted);
        });
    }
    self.imagepreview_post= function(request){
        if(!request.payload.preview_iid){
            response(request,'preview_iid of image missing');
            return;
        }

        if(!request.payload.place_id){
            response(request,'place_id of place');
            return;
        }

        var dataContainer = {
            preview_iid :request.payload.preview_iid,
            place_id :request.payload.place_id
        }

        levelEngine.ipreview(pgClient, dataContainer, function(err, deleted){
            response(request, err, deleted);
        });
    }


    self.info_post = function(request) {
        levelEngine.updateInfo(pgClient, request.payload, function(err, list){
            response(request, err, list);
        })
    }

    self.info_get = function(request){
        if(!request.query){
            response(request,'missing id of info');
            return;
        }

        levelEngine.getInfo(pgClient, request.query, function(err, list){
            response(request, err, list);
        })
    }

    self.infos_get = function(request){
        var fields = ['pi']
        if(request.query.fields){
            fields = request.query.fields.split(',') ;
        }

        levelEngine.listInfo(pgClient, fields, function(err, list){
            response(request, err, list);
        })
    }

    self.infotypes_get = function(request){
        var fields = ['pit']
        if(request.query.fields){
            fields = request.query.fields.split(',') ;
        }

        levelEngine.listInfoTypes(pgClient, fields, function(err, list){
            response(request, err, list);
        })
    }

    self.infocreate_post = function(request){

        if(!request.payload.name){
            response(request,'missing name of new info');
            return;
        }

        if(!request.payload.type){
            response(request,'missing type of new info');
            return;
        }

        levelEngine.createInfo(pgClient, request.payload, function(err, list){
            response(request, err, list);
        })
    }


    return self;

})();





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

function superResponse(request){
    return function(err, data){
        response(request, err, data);
    }
}


function imageSetupPreviewAndResponse(request, err, data, place_id, pg){
    if(err){
       response(request, err, data) ;
    } else {
        levelEngine.checkAndSetupPreview(pg, {preview_iid:data.imageId,place_id:place_id}, function(err, dataImage){
            response(request, err, data);
        });
    }



}