var userEngine = require(process.cwd() + '/engine/user.js');
var Passport = null;
var Travelelogue = null;

module.exports = {
    /**
     *
     * @param server
     * @param Hapi
     */
    $init : function(server, Hapi){
        Travelelogue = server.plugins.travelogue;
        Passport = Travelelogue.passport;



    }
    // get Hapi Config
    ,$getConfig : function(){
        return {
            index_get : {
                auth : 'passport'
            }
        }
    }
    ,index_get : function (request){

        request.reply.view('index');
    }
    ,login_get : function(request){
        if (request.session._isAuthenticated()) {
            request.reply.redirect('/');
        } else {
            var form = '<form action="/login/" method="post"> <div> <label>Username:</label> <input type="text" name="username"/> </div> <div> <label>Password:</label> <input type="password" name="password"/> </div> <div> <input type="submit" value="Log In"/> </div> </form>';
            request.reply(form);
        }
    }
    ,login_post: function(request){
        Passport.authenticate('local', {
            successRedirect: '/',
            failureRedirect: '/login/',
            failureFlash: true
        })(request);
    }
    ,logout_get: function(request){
        request.session._logout();
        request.reply.redirect('/');
    }
    ,session_get: function(request){
        request.reply("<pre>" + JSON.stringify(request.session, null, 2) + "</pre><br/><br/><a href='/login'>Login</a>");
    }
    ,clear_get: function(request){
        request.session.reset();
        request.reply.redirect('/session');
    }
}