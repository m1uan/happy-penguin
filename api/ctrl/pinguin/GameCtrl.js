var levelEngine = require(process.cwd() + '/engine/levels/levels.js')
    ,levelCtrl = require('../admin/LevelsCtrl.js')
    ,async = require('async');
var Passport = null;
var Travelelogue = null;
var pgClient = null;

function func(){
    var self = {};
    var pg = null;

    self.$init = function(server, Hapi){
        pg = server.pgClient;
    }

    self.$getConfig = function(){
        return {
            auth:'passport',
            get_get : {
                auth:false,
                params : '{params*}'
            },list_get : {
                auth:false,
                params : '{params*}'
            },get_get : {
                auth:false,
                params : '{params*}'
            },langs_get : {
                auth:false,
                params : '{params*}'
            }
        }
    }


    self.list_get = function(request){
        levelCtrl.list_get(request);
    }

    self.get_get = function(request){
        levelCtrl.get_get(request);
    }


    self.langs_get = function(request){

        var data = request.params.params.split('/');
        levelEngine.langsAndCities(pg, data[0], superResponse(request));
    }


    return self;

}

module.exports = func();





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