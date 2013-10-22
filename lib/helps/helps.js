var async = require('async');

module.exports.sqlMake = function(pgClient, commands, cb){

    var as = [];

    commands.forEach(function(val, idx){
        as.push(function(icb)
        {
            console.log(val)  ;
            pgClient.query(val, function(err, data){
                if(err){
                    icb(err, null);
                } else {
                    icb(err, true);
                }
            });
        });
    });


    async.parallel(as,
        function(err){
            if(err){
                console.log(err);
            }
            cb();
        });
}