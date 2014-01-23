var request = require('supertest'),
    should = require('should');
//var server = require('../../server.js');
describe('device', function(){
    describe('delete', function(){
        it('post', function(cb){
            //var ser = new server();


            var req =  request('http://localhost:8080');

            req.post('/device/current/index/deleted')
                //.expect('Content-Type', /json/)
                //.expect('Content-Length', '20')
                .set('Content-Encoding', /json/)
                .expect(200)
                .send({deleted:[{l:100,w1:'ahoj',w2:'ahoj2',n1:'cs',n2:'en'}]})
                .end(function(err, res){
                    console.log(res);
                    if (err) {

                        throw err;

                    }
                    cb();
                });
        });
    });

    describe('score', function(){
        it.only('get', function(cb){
            //var ser = new server();


            var req =  request('http://localhost:8080');

            req.get('/device/current/index/scores/1001/en/0/?timespan='+new Date().getTime() + '&score=200')
                .expect('Content-Type', /json/)

                .expect(200)
                .end(function(err, res){
                    console.log(res);
                    if (err) {

                        throw err;

                    }
                    cb();
                });
        });

        it('post', function(cb){
            //var ser = new server();


            var req =  request('http://localhost:8080');

            req.post('/device/current/index/scoreadd/1001/en/0/')
                .expect('Content-Type', /json/)
                //.expect('Content-Length', '20')
                .send({score:{name:'karel',score:40}})
                .expect(200)
                .end(function(err, res){
                    console.log(res);
                    if (err) {

                        throw err;

                    }
                    cb();
                });
        });

        it('add test', function(){
            var device = require('../../api/ctrl/device/current/IndexCtrl.js');
            var default1 = '[ { "name":"Milan Medlik", "score": 3000, "time":"0" }, { "name":"Milan Medlik", "score": 2500, "time":"0" }, { "name":"Milan Medlik", "score": 2000, "time":"0" }, { "name":"Milan Medlik", "score": 1500, "time":"0" }, { "name":"Milan Medlik", "score": 1250, "time":"0" }, { "name":"Milan Medlik", "score": 1000, "time":"0" }, { "name":"Milan Medlik", "score": 750, "time":"0" }, { "name":"Milan Medlik", "score": 600, "time":"0" }, { "name":"Milan Medlik", "score": 500, "time":"0" }, { "name":"Milan Medlik", "score": 400, "time":"0" }, { "name":"Milan Medlik", "score": 300, "time":"0" }, { "name":"Milan Medlik", "score": 200, "time":"0" }, { "name":"Milan Medlik", "score": 100, "time":"10" } ]';
            var position = device.getPossiblePosition(default1, 90, 'miuan');
            position.should.be.eql(13);

            position = device.getPossiblePosition(default1, 190, 'miuan');
            position.should.be.eql(11);
            var scores = device.addHeightScoreIntoScores(default1, 90, 'miuan');
            console.log(scores);

            var scores = device.addHeightScoreIntoScores(default1, 190, 'miuan');
            console.log(scores);

            scores.length.should.be.eql(13);
        });
    });
});
