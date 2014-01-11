var LocalStrategy = require('passport-local').Strategy;
var userEngine = require(process.cwd() + '/engine/user.js');

module.exports = {
    initialize : function(Hapi, server) {

        var config = {
            urls: {
                failureRedirect: '/login/'
            },
            excludePaths: ['/public/']
        };
        var plugins = {
            yar: {
                cookieOptions: {
                    password: "worldofwalmart",
                    isSecure: false
                }
            },
            travelogue: config // use '../../' instead of travelogue if testing this repo locally
        }

        server.pack.allow({ ext: true }).require(plugins, function (err) {

            if (err) {
                throw err;
            }
        });


        var USERS = {
            "m": "a"
        };



        var Passport = server.plugins.travelogue.passport;
        Passport.use(new LocalStrategy(function (username, password, done) {
            userEngine.getUserByName(server.pgClient, username, function(err, user){
                // Find or create user here...
                // In production, use password hashing like bcrypt

                console.log(user);
                if (!err && user && user.pass == password) {
                    user.pass = undefined;
                    userEngine.setLastLogin(server.pgClient,user.id, function(){});
                    return done(null, user);
                }

                return done(null, false, { 'message': 'invalid credentials' });
            });

        }));



        Passport.serializeUser(function (user, done) {
            //console.log('serializeUser');
            //console.log(user);
            done(null, user.id);
        });



        Passport.deserializeUser(function (id, done) {
            userEngine.getUserById(server.pgClient, id, function(err, user){
               // console.log('deserializeUser');
                console.log(user);
                console.log(id);
                if(err){
                    done(null, id);
                }else {
                    done(null, user);
                }

            });
        });


        if (process.env.DEBUG) {
            server.on('internalError', function (event) {

                // Send to console
                console.log(event)
            });
        }






    }
}



