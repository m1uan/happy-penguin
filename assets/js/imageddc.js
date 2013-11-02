
function dragImage(name, linkId){
    var IMAGE_ORIG = '/assets/img/orig/';
    console.log('ahoj');
    $(name).on(
        'dragover',
        function(e) {
            $(name).addClass('over');
            e.preventDefault();
            e.stopPropagation();
        }
    )
    $(name).on(
        'dragleave',

        function(e) {
            $(name).removeClass('over');
            //console.log(e);
            e.preventDefault();
            e.stopPropagation();
        }
    )

    $(name).on(
        'drop',
        function(e){
            e.preventDefault();
            e.stopPropagation();
            console.log(e);

            if(e.originalEvent.dataTransfer.items){
                console.log(e.originalEvent.dataTransfer.items, e.originalEvent.dataTransfer.items.length);

                if(e.originalEvent.dataTransfer.items.length == 1){
                    e.originalEvent.dataTransfer.items[0].getAsString(function(url){
//                        var obj = jQuery(url);



                        //previewFromFile(src);

                        loadImageFromResource(url);
                        console.log(1, url);
                    });
                }

                if(e.originalEvent.dataTransfer && e.originalEvent.dataTransfer.items.length > 1){
                    e.originalEvent.dataTransfer.items[1].getAsString(function(url){

                        var obj = jQuery(url);
                        var src = obj.attr('src');

                        var fr = new FileReader();

                        fr.onload = function(data){
                            console.log(21, data);
                        };



                        console.log(2, url);


                        //previewFromFile(src);
                        if(src.indexOf('http://') == 0 || src.indexOf('https://') == 0){
                            saveImgUrl(src);
                        } else {

                            prepareAndUploadData(src);

                        }


                        //$(name).attr('src',src);
                        //console.log(url);
                    });
                }


                if(e.originalEvent.dataTransfer){
                    if(e.originalEvent.dataTransfer.files.length) {

                        var f = e.originalEvent.dataTransfer.files[0];

                        previewFromFile(f);
                        console.log(3,f);
                        /*UPLOAD FILES HERE*/
                        //upload(e.originalEvent.dataTransfer.files);
                    }
                }
            }



        }


    );


    function saveImgUrl(url){
        console.log('saveImgUrl', url) ;

        var fd = new FormData();
        fd.append("link", linkId);
        fd.append("url", url);
        $.ajax({
            type: 'POST',
            url: '/words/saveimgurl',
            data: fd,
            processData: false,
            contentType: false,
            success : function(data, status, headers, config) {
                console.log(data);
                loadImageFromResource(data);
                uploadThumbIfNeed(data);
            },
            error:function(data, status, headers, config) {
                // called asynchronously if an error occurs
                // or server returns response with an error status.
            }
        });


    }

    function uploadThumbIfNeed(data){
        console.log('uploadThumbIfNeed', data) ;
        if(data.length){
            data.forEach(function(val, idx){
                if(val.version == 0){
                    if(!val.thumbfile){
                        var url = val.imagefile
                        var imageInfo = {src:IMAGE_ORIG + val.imagefile};
                        var endOf = '.png';
                        // endsWith
                        if(url.indexOf(endOf, url.length - endOf.length) !== -1){
                            imageInfo.type = 'image/png';
                        } else {
                            imageInfo.type = 'image/jpeg';

                        }

                        cropImage(imageInfo, function(thumb){
                            uploadData(val.lid, null, null, thumb, val.imageid);
                        });
                    }

                    return ;
                }
            });
        }
    }

    function prepareAndUploadData(res, thumb){
        console.log('prepareAndUploadData', res, thumb) ;
        var data = res.split(',');
        // this code is not public so don't watch it! :-P
        var type = data[0].split(';')[0].split(':')[1];

        cropImage({src : res, type: type}, function(thumb){
            uploadData(linkId, data[1], type, thumb);
        });


    }

    function uploadData(linkdId, file, type, thumb, thumbFor){
        console.log('uploadData', linkdId, file, type, thumb, thumbFor) ;
        var fd = new FormData();
        fd.append("link", linkId);

        if(file && type){
            fd.append("file", file);
            fd.append("type", type);
        } else if(thumb && thumbFor){
            fd.append("thumbFor", thumbFor);
        } else {
            console.err(uploadData, 'the parrams is not complete, sorry :-P');
            return ;
        }

        if(thumb) {
            fd.append("thumbData", thumb);
        }



        $.ajax({
            url: "/words/uploadimg",
            type: "POST",
            data: fd,
            processData: false,
            contentType: false,
            success: function(response) {
                // .. do something
                console.log(response);

                loadImageFromResource(response);
            },
            error: function(jqXHR, textStatus, errorMessage) {
                console.log(errorMessage); // Optional
            }
        });
    }


    function loadImageFromResource(res){
        console.log('loadImageFromResource', res) ;
        // CANVAS error CROS image data

        if(res.length){
            res.forEach(function(val, idx){
                if(val.version == 0){

                    if(!val.thumbfile){
                        var src = IMAGE_ORIG + val.imagefile;
                        $(name).attr('src', src);
                    }

                    if(val.thumbfile){
                        // show in thumb
                        var thumb = '/assets/img/thumb/' + val.thumbfile;
                        $(name + '_thumb').attr('src', thumb);
                    }
                    console.log('src', src, thumb);
                }
            });


        }



    }

    function previewFromFile(f){
        var reader = new FileReader(f);

        //attach event handlers here...
        reader.onload = function (ef) {
            prepareAndUploadData(ef.target.result);
        }

        reader.onerror = function(err){
            console.log(err);
        }

        reader.readAsDataURL(f);
    }

    $(name + '_file').on('change',function ()
    {

        previewFromFile(this.files[0]);
//            var filePath = 'file:///' +  $(this).val();
//            $(name).attr('src',filePath);
        console.log(this.files[0]);
    });


}

function cropImage(imgData, cb){
    console.log('cropImage', imgData) ;
    var canvas = document.getElementById('myCanvas');
    var context = canvas.getContext('2d');
    var imageObj = new Image();


    imageObj.onload = function() {
        var minWH = imageObj.width < imageObj.height ? imageObj.width : imageObj.height;
        // center source
        var sourceX = (imageObj.width - minWH)/2;
        var sourceY = (imageObj.height - minWH)/2;


        console.log('w/h', imageObj.width, imageObj.height);
        console.log(minWH, sourceX, sourceY);

        var destX = 0;
        var destY = 0;

        context.drawImage(imageObj, sourceX, sourceY, minWH, minWH, 0, 0, 128, 128);
        var data = canvas.toDataURL(imgData.type).split(',');
        cb(data[1]);
    };

    imageObj.src = imgData.src;
}