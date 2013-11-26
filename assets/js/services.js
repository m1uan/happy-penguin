app.service('dialogService', function($http) {

        this.showDialogById = function(dialogId, yesevent) {
            var modalDialog = $(dialogId);

            modalDialog.find('#yesbutton').click(function(event) {
                if(!yesevent(event)){
                    modalDialog.modal('hide');
                }

            });

            modalDialog.modal('show');

            return modalDialog;
        }

        this.showConfirmDialog = function(title, message, yesevent){
            var modalDialog = this.showDialogById('#modal-from-dom', yesevent);

            modalDialog.find('#warning_dialog_title').text(title);
            modalDialog.find('#warning_dialog_message').text(message);
        }
});


app.service('wordService', function($http) {

    this.saveImgUrl = function(link,url,cb){
        var dataContainer = {
            url : url,
            link : link
        };


        $http({
            method: 'POST',
            url: '/words/saveimgurl',
            data: dataContainer}).
            success(function(data, status, headers, config) {
                console.log(data);
                cb(data);
            }).
            error(function(data, status, headers, config) {
                // called asynchronously if an error occurs
                // or server returns response with an error status.
            });


    }


    this.updateWord = function(lang,link,word, record,cb){
        var dataContainer = {
            lang : lang,
            link : link,
            word: word,
            record: record
        };


        $http({
            method: 'POST',
            url: '/words/update',
            data: dataContainer}).
            success(function(data, status, headers, config) {
                console.log(data);
                cb(data);
            }).
            error(function(data, status, headers, config) {
                // called asynchronously if an error occurs
                // or server returns response with an error status.
            });


    }


    this.deleteImg = function(link,cb){
        var dataContainer = {
            link : link
        };


        $http({
            method: 'POST',
            url: '/words/deleteimg',
            data: dataContainer}).
            success(function(data, status, headers, config) {
                console.log(data);
                cb(data);
            }).
            error(function(data, status, headers, config) {
                // called asynchronously if an error occurs
                // or server returns response with an error status.
            });


    }


    this.deleteLink = function(word){
        $http({
            method: 'POST',
            url: '/words/deletelink',
            data: {links:[word.link]}}).
            success(function(data, status, headers, config) {

                console.log(data);
                data[0].some(function(dl){
                    if(dl.lid == word.link){
                        word.del = dl.del;
                        return true;
                    }

                });

            }).
            error(function(data, status, headers, config) {
                // called asynchronously if an error occurs
                // or server returns response with an error status.
            });
    }
});



