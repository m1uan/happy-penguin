module.exports = {

    index_get : function (request){
            request.reply.view('index', {title: 'mister'});
    },
    ahoj_get : function (request){
        request.reply('ahoj_get');
    }
}