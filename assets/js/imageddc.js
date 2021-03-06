function focusElement(el, focusShow){
    if(focusShow){
        el.addClass('focused-row');
        el.find('.focused-hide').hide();
        el.find('.focused-show').show();
        el.find('.focused-image').removeClass('image-out-focus');
        el.find('.focused-image').addClass('image-in-focus');
    } else {
        el.removeClass('focused-row');
        el.find('.focused-show').hide();
        el.find('.focused-hide').show();
        el.find('.focused-image').removeClass('image-in-focus');
        el.find('.focused-image').addClass('image-out-focus');
    }
}

function dragImage(element, imageElement, fileElement, linkId, uploadConfig){
    var UPLOAD_URL =  '/words/uploadimg';
    var UPLOADURL_URL = '/words/saveimgurl';
    var IMAGE_ORIG = '/assets/img/orig/';
    var IMAGE_THUMB = '/assets/img/orig/';

    if(uploadConfig && uploadConfig.UPLOAD_URL){
        UPLOAD_URL = uploadConfig.UPLOAD_URL;
    }

    if(uploadConfig && uploadConfig.UPLOADURL_URL){
        UPLOADURL_URL = uploadConfig.UPLOADURL_URL;
    }

    if(uploadConfig && uploadConfig.IMAGE_ORIG){
        IMAGE_ORIG = uploadConfig.IMAGE_ORIG;
    }

    if(uploadConfig && uploadConfig.IMAGE_THUMB){
        IMAGE_THUMB = uploadConfig.IMAGE_THUMB;
    }

    //console.log('dragImage', imageElement.attr('id'), linkId);
    element.on(
        'dragenter',
        function(e) {
            //imageElement.addClass('imgpreview-draged');
            //element.addClass('img-draged');
            //focusElement(element, true);
            e.preventDefault();
            e.stopPropagation();
        }

    )

    element.on(
        'dragover',
        function(e) {
            imageElement.addClass('imgpreview-draged');
            element.addClass('img-draged');
            //element.addClass('img-draged');
            //focusElement(element, true);
            e.preventDefault();
            e.stopPropagation();
        }
    )
    element.on(
        'dragleave',

        function(e) {
            imageElement.removeClass('imgpreview-draged');
            element.removeClass('img-draged');

            //focusElement(element, false);
            //console.log(e);
            e.preventDefault();
            e.stopPropagation();
        }
    )

    element.on(
        'drop',
        function(e){
            e.preventDefault();
            e.stopPropagation();
            console.log(e);
            imageElement.removeClass('imgpreview-draged');
            element.removeClass('img-draged');
            //focusElement(element, false);

            if(e.originalEvent.dataTransfer.files && e.originalEvent.dataTransfer.files.length > 0){
                previewFromFile(e.originalEvent.dataTransfer.files[0]);
                return;
            }

            // works in firefox 24.0
            // works for chrome 30.0
            var html = e.originalEvent.dataTransfer.getData('text/html')
            var srca = html.match(/src\s*=\s*"(.+?)"/)
            var src = srca[1];
            console.log(src);


            if(src.indexOf('http://') == 0 || src.indexOf('https://') == 0){
                saveImgUrl(src);
            } else {
                prepareAndUploadData(src);
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
            url: UPLOADURL_URL,
            data: fd,
            processData: false,
            contentType: false,
            success : function(data, status, headers, config) {
                console.log('data', data);
                loadImageFromResource(data);
                uploadThumbIfNeed(data);

                if(uploadConfig && uploadConfig.callback){
                    uploadConfig.callback(null, {'response':data});
                }
            },
            error:function(jqXHR, status, headers, config) {
                // called asynchronously if an error occurs
                // or server returns response with an error status.
                var modalDialog = $('#modal-error');
                modalDialog.modal('show');
                modalDialog.find('#origin-message').text(jqXHR.responseText);

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

//        var xhr = new XMLHttpRequest();
//        xhr.open('POST', UPLOAD_URL, true);
//        xhr.onload = function(e) { alert('ahoj' + this.responseText) };
//        xhr.send(fd);

        $.ajax({
            url: UPLOAD_URL,
            type: "POST",
            data: fd,
            processData: false,
            contentType: false,
            success: function(response) {
                // .. do something
                console.log(response);

                loadImageFromResource(response);
                if(uploadConfig && uploadConfig.callback){
                    uploadConfig.callback(null, response);
                }
            },
            error: function(jqXHR, textStatus, errorMessage) {
                if(uploadConfig && uploadConfig.callback){
                    uploadConfig.callback(jqXHR, errorMessage);
                } else {
                    // jqXHR.responseText
                    var modalDialog = $('#modal-error');
                    modalDialog.find('#origin-message').text(jqXHR.responseText);
                    modalDialog.modal('show');
                    console.log(errorMessage,jqXHR); // Optional
                }

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
                        imageElement.attr('src', src);
                    }

                    if(val.thumbfile){
                        // show in thumb
                        var thumb = IMAGE_THUMB + val.thumbfile;
                        imageElement.attr('src', thumb);
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

    fileElement.on('change',function ()
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