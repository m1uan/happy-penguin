var request = require('supertest');
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
        it('get', function(cb){
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

        it.only('post', function(cb){
            //var ser = new server();


            var req =  request('http://localhost:8080');

            req.post('/device/current/index/scoreadd/1001/en/0/')
                .expect('Content-Type', /json/)
                //.expect('Content-Length', '20')
                .send({score:{name:'karel',score:140}})
                .expect(200)
                .end(function(err, res){
                    console.log(res);
                    if (err) {

                        throw err;

                    }
                    cb();
                });
        });
    });
});
