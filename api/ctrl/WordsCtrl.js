var wordsEngine = require(process.cwd() + '/engine/words.js')
    ,async = require('async'),
    Hapi = require('hapi');

var pgClient = null;

module.exports = {

    // init
    $init : function(server, Hapi){
        pgClient = server.pgClient;

    },
    // get Hapi Config
    $getConfig : function(){
        return {
            auth : 'passport'
            ,params : '{params*}'
            ,test_get : {
                auth : false
            },lesson_get : {
                params : '{params*}'
            }
        }
    },
    test_get : function(request){
      request.reply('heelo');
    },
    get_get : function (request){
        var langs = request.params.params.split('/');
        var lesson = langs.shift();

        var word = new wordsEngine.WORDS(pgClient, lesson);

        langs.forEach(function(val){
           word.addLang(val);
        });

        var fields = request.query.fields.split(',') ;
        console.log(request);
        console.log(request.query);
        word.get(fields, function(err, words){
            request.reply(words);
        });

    },
    index_get : function (request){


        //console.log(request.getParam('l2'));
        wordsEngine.getWordsWithImages(pgClient, ['cs', 'en'], 1, function(err, words){
            request.reply(err ? err : words);
        });
    },
    lesson_get : function (request){

        //console.log(request.getParam('l2'));
        //  http://localhost:8080/words/lesson/2/de/cs
        if(request.params.params && request.params.params.length > 0){
            var langs = request.params.params.split('/');
            var lesson = langs.shift();

            console.log(langs);
            console.log(lesson);

            wordsEngine.getWordsWithImages(pgClient, langs, lesson, function(err, words){
                request.reply(err ? err : words);
            });
        } else {
            var error = Hapi.error.badRequest('format : /lesson/lang1/lang2/{lang3?}');
            error.response.code = 402;    // Assign a custom error code
            error.reformat();
            request.reply(error);
        }
    },
    update_post : function(request){
        console.log(request.payload);

        var updateUser = request.payload;

        wordsEngine.updateWord(pgClient, updateUser, request.user.id, function(err, data){
           request.reply(err || data);
        } );
    },
    saveimgurl_post : function(request){
        console.log(request.payload);
        var imageEngine = require(process.cwd() + '/engine/image.js');
        var updateImg = request.payload;

        var userId = request.user.id;

        imageEngine.saveFromUrl(pgClient, userId, updateImg.link, updateImg.url, function(err, data){
            request.reply(err || data);
        } );
    },
    deleteimg_post: function(request){
        var link = require(process.cwd() + '/engine/link.js');

        var updateImg = request.payload;
        link.deleteImageAndGet(pgClient, request.user.id, updateImg.link, function(err, data){
            request.reply(err || data);
        });
    },
    // http://stackoverflow.com/questions/18994881/convert-base64-image-to-raw-binary-with-node-js
    // http://stackoverflow.com/questions/9622901/how-to-upload-a-file-using-jquery-ajax-and-formdata
    uploadimg_post: function(request){
        var image = require(process.cwd() + '/engine/image.js');
        var linkEngine = require(process.cwd() + '/engine/link.js');

        console.log('payload', request.payload);
        var userId = request.user.id;

        var dataInfo = {
            file : request.payload.file,
            type : request.payload.type

        };


        // must be specified image for which imageId
        if(request.payload.thumbFor){
            dataInfo.thumbFor = request.payload.thumbFor;
        }

        if(request.payload.thumbData){
            dataInfo.thumbData = request.payload.thumbData;
        }



        image.storeImgFromData(pgClient, userId, dataInfo, function(err, imageData){
            var linkConteiner = {
                imageId : imageData.imageId,
                image : imageData.imageFile,
                lid : request.payload.link};
            //console.log(linkConteiner);
            if(!err){

                // image is just thumb and is stored in image
                // not necessary make any changes in link
                if(!dataInfo.thumbFor){
                    linkEngine.updateAndGet(pgClient, userId, linkConteiner, function(err, data){
                        request.reply(err || data);
                    });
                } else {
                    linkEngine.get(pgClient, linkConteiner.lid, function(err, data){
                        request.reply(err || data);
                    });
                }

            } else {
                console.log(err);
                request.reply(err);
            }

        });



//        function(err, file){
//
//            console.log(err, request.payload);
//        })




    },
    duplicity_post : function (request){

        console.log('duplicity_post********', request.payload);
        //  http://localhost:8080/words/duplicity/de/cs

        if(request.payload && request.payload.links
            && request.payload.links.length > 0){

            var words = request.payload.links;
            var langs = words.shift();

            console.log(langs);



            wordsEngine.getRepeatWords(pgClient, langs, words, function(err, words){
                if(err){
                    err_response(request, err);
                }else {
                    request.reply(words);
                }


            });
        } else {
            err_response(request, 'not format : /lesson/lang1/lang2' +
                ' or missing Array links in payload');
        }

    },
    deletelink_post: function (request){
        var linksEngine = require(process.cwd() + '/engine/link.js');

        linksEngine.deleteLink(pgClient, request.payload.links, request.user.id, function(err, data){
            if(err) {
                err_response(request, err);
            } else {
                request.reply(data);
            }

        });

    },
    addword_post: function (request){
        wordsEngine.addWord(pgClient, request.payload.word, request.user.id, function(err, data){
            if(err) {
                err_response(request, err);
            } else {
                request.reply(data);
            }

        });
    }


//    ,wordsControler : function(){
//      function getWord(lang1, lang2, cb){
//          var sql = 'SELECT word.word as word1cs, w2.word as word2en, word.lang, w2.lang, image.image from word ' +
//              + ' LEFT JOIN word w2 on word.link = w2.link ' +
//              + ' LEFT JOIN image on word.link=image.link ' +
//              +' WHERE word.lang= $1 AND w2.lang= $2 ' +
//              +' AND word.link > 10 AND word.link < 20';
//
//          //console.log(sql)  ;
//          pgClient.query(sql, [lang1, lang2], function(err, data){
//              //console.log(data);
//              cb(err, {words: data.rows});
//
//          });
//      }
//    }

}

function err_response(request, err){
    var error = Hapi.error.badRequest(err);
    error.reformat();
    request.reply(error);
}
