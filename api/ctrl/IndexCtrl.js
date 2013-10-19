module.exports = {
    // get Hapi Config
    $getConfig : function(){
        return {
            index_get : {
                auth : 'passport'
            }
        }
    },
    index_get : function (request){
        request.reply("ACCESS GRANTED<br/><br/><a href='/logout/'>Logout</a>");
    },
    login_get : function(request){
        if (request.session._isAuthenticated()) {
            request.reply.redirect('/');
        } else {
            var form = '<form action="/login" method="post"> <div> <label>Username:</label> <input type="text" name="username"/> </div> <div> <label>Password:</label> <input type="password" name="password"/> </div> <div> <input type="submit" value="Log In"/> </div> </form>';
            request.reply(form);
        }
    },
    logout_get: function(request){
        request.session._logout();
        request.reply.redirect('/');
    } ,
        session_get: function(request){
        request.reply("<pre>" + JSON.stringify(request.session, null, 2) + "</pre><br/><br/><a href='/login'>Login</a>");
    },clear_get: function(request){
        request.session.reset();
        request.reply.redirect('/session');
    }
}