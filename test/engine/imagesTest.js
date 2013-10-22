var assert = require("assert"),
    images = require('../../engine/image.js'),
    pg = require('pg'),
    should = require('should')
    , async = require('async')
    ,dbox = require('dbox')
    ,config = require('../../config/local.js');

var dboxClient = null;

describe.skip('image-dropbox', function(){

    before(function(){

    });

    after(function(){

    });


    describe('download and store images', function(){
        it('change image history', function(cb){
            var imgfile = 'http://t2.gstatic.com/images?q=tbn:ANd9GcRr0WK-Q2t4Xxr1b6Kl7-lXdVEIh_Hj3HiDXk--Qg_0UAY0Y96P6w';



            images.saveFromUrl(1, imgfile, function(err, name){

            });
        });
        it('download from url', function(cb){
            var imgfile = 'http://t2.gstatic.com/images?q=tbn:ANd9GcRr0WK-Q2t4Xxr1b6Kl7-lXdVEIh_Hj3HiDXk--Qg_0UAY0Y96P6w';
            images.saveFromUrl(1, imgfile, function(err, name){

            });
        });
    });




})