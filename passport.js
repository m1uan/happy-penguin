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
                    return done(null, user);
                }

                return done(null, false, { 'message': 'invalid credentials' });
            });

        }));



        Passport.serializeUser(function (user, done) {
            done(null, user);
        });



        Passport.deserializeUser(function (obj, done) {

            done(null, obj);
        });


        if (process.env.DEBUG) {
            server.on('internalError', function (event) {

                // Send to console
                console.log(event)
            });
        }














        server.addRoute({
            method: 'GET',
            path: '/public/{path}',
            handler: {
                directory: {
                    path: './public'
                }
            }
        });


    }
}



