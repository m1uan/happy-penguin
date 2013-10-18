var assert = require("assert"),
    vocCtrl = require('../../api/ctrl/WordsCtrl.js');

describe('Array', function(){
    describe('#indexOf()', function(){
        it('should return -1 when the value is not present', function(){
            assert.equal(-1, [1,2,3].indexOf(5));
            assert.equal(-1, [1,2,3].indexOf(0));

        })
    });
    describe('getWords', function(){
        it('load words from database', function(cb){

            vocCtrl.getWords('cs','en', 1);
            cb();
        })
    });
})