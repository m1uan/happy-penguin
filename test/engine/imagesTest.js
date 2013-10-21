var assert = require("assert"),
    words = require('../../engine/image.js'),
    pg = require('pg'),
    should = require('should')
    , async = require('async')
    ,dbox = require('dbox');

var dboxClient = null;
var dboxuser = 'miuan@seznam.cz';
var dboxpass = '*miuan@seznam.cz';
var dboxkey = 'e4mr1r1qlk6qd5o';
var dboxsecret = '0tjopj3wkufz4m4';

describe('image-dropbox', function(){

    before(function(){

    });

    after(function(){

    });


    describe('files in dropbox', function(){
        it('test connection', function(cb){
            // https://www.dropbox.com/developers/apps/info/e4mr1r1qlk6qd5o
            dboxClient   = dbox.app({ "app_key": dboxkey, "app_secret": dboxsecret })
            dboxClient.requesttoken(function(status, request_token){
                console.log(request_token);
                console.log(status);
                dboxClient.accesstoken(request_token, function(status, access_token){
                    console.log('access token');
                    console.log(status);
                    console.log(access_token);

                    var client = dboxClient.client(access_token);
                    client.account(function(status, reply){
                        console.log(reply);
                        cb();
                    })
                })
            })


        });
    });


})