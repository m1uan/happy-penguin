var LocalStrategy = require('passport-local').Strategy;
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
            "van": "walmart"
        };

        var Passport = server.plugins.travelogue.passport;
        Passport.use(new LocalStrategy(function (username, password, done) {

            // Find or create user here...
            // In production, use password hashing like bcrypt
            if (USERS.hasOwnProperty(username) && USERS[username] == password) {
                return done(null, { username: username });
            }

            return done(null, false, { 'message': 'invalid credentials' });
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
            method: 'POST',
            path: '/login',
            config: {
                validate: {
                    payload: {
                        username: Hapi.types.String(),
                        password: Hapi.types.String()
                    }
                },
                auth: false,
                handler: function (request) {

                    Passport.authenticate('local', {
                        successRedirect: config.urls.successRedirect,
                        failureRedirect: config.urls.failureRedirect,
                        failureFlash: true
                    })(request)
                }
            }
        });











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



