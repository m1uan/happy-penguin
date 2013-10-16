module.exports = {

    index : {
        path : '/',
        handler : function (request){
            request.reply('ahoj');
        }
    } ,
    ahoj : function (request){
        request.reply('ahoj');
    }
}