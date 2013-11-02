var  async = require('async');


module.exports = {
    IMAGE_DELETE : {key:'delete image'}
    ,initialize : function(server, Passport) {

    }
    /**
     *
     * @param pgClient
     * @param userId
     * @param link { image, description, lid }
     * @param cb
     */
    , update : function(pgClient, userId, linkData, cb){

        if(!linkData || !linkData.lid){
            throw 'parameter link must contain property : lid';
        }

        // most important must be before series
        // because is used in selectOld, ...
        var linkId = linkData.lid;
        var hasUpdated = false;

        async.series([
            selectOld
            ,moveToHistory
            , tryUpdateOld
            ,createNew
        ], cb);


        function selectOld(icb){
            var sql = null;
            if(!linkData.description || !linkData.imageFile && linkData.imageFile != ''){
                sql = 'SELECT description, image FROM link WHERE lid = $1 AND version = 0';
            }


            if(sql){
                var sqlData = [linkId];
                console.log('link.update', sql,  sqlData)  ;
                pgClient.query(sql, sqlData, function(err, data){
                    var row = data && data.rows && data.rows.length > 0 ? data.rows[0] : null;



                    if(err || !row){
                        icb('error or the link dont select : ' + linkId, false);
                        return;
                    }



                    linkData.description  = row.description;
                    if(!linkData.image){
                        linkData.image  = row.image;
                    }


                    icb(err, linkData);
                });
            } else {
                icb(null, linkData);
            }


        }

        function moveToHistory(icb){
            var sql = 'UPDATE link SET version = (SELECT max(version)+1 FROM link WHERE lid = $1) WHERE lid = $1 AND version = 0;';

            console.log(sql)  ;
            pgClient.query(sql, [linkId], function(err, data){
                if(err){
                    icb(err || 'no update row', false);
                } else {
                    icb(null, linkData);
                }
            });
        }

        function tryUpdateOld(icb){
            var imageId = null;

            if(linkData.imageId !== module.exports.IMAGE_DELETE){
                imageId = linkData.imageId;
            }

            var sql = 'UPDATE link SET version = 0, usr = $2 WHERE lid = $1 AND description = $3 AND image';
            var params = [linkId, userId, linkData.description];

            if(imageId) {
                sql += ' = $4';
                params.push(imageId);
            }else {
                sql += ' IS NULL';
            }

            console.log('tryUpdateOld:', sql, params)  ;
            pgClient.query(sql, params, function(err, data){
                if(err ){
                    icb(err || 'no insert row', false);
                } else {
                    //console.error(data);
                    // updated
                    hasUpdated = data.rowCount > 0;
                    icb(null);
                }
            });
        }


        function createNew(icb){
            console.log('has updated', hasUpdated);

            var image = null;

            if(linkData.imageId !== module.exports.IMAGE_DELETE){
                image = linkData.imageId;
            }

            // skip insert new because have
            // been updated by tryUpdateOld
            if(hasUpdated){

                icb(null, hasUpdated);
                return;
            }

            var sql = 'INSERT INTO link (lid,image,description,usr,lesson)' +
                ' VALUES($1,$2,$3,$4,' +
                '(SELECT min(lesson) FROM link WHERE lid = $1)' +
                ');';
            var sqlData = [linkId, image, linkData.description, userId];
            console.log(sql, sqlData)  ;
            pgClient.query(sql, sqlData, function(err, data){
                if(err ){
                    icb(err || 'no insert row', false);
                } else {
                    icb(null, linkData);
                }
            });
        }







    }, get : function(pgClient, linkId, tables, cb){
        console.log('BEGIN:link.get', linkId);
        if(!cb){
            cb = tables;
        }

        var sqlData = [linkId];
        var sql = 'SELECT lid,description, link.usr, version, image.image as imageFile, image.iid as imageId, image.thumb as thumbFile FROM link LEFT JOIN image ON image.iid = link.image WHERE lid = $1;';

        console.log('link.get', sql, sqlData)  ;
        pgClient.query(sql, sqlData , function(err, data){
            console.log('BACK:link.get', err, data.rows);
            if(err ){
                cb('err:' + err, false);
            } else {
                cb(null, data.rows);
            }
        });

    }, updateAndGet : function(pgClient, userId, linkData, tables, cb){
        console.log('BEGIN:link.updateAndGet', userId, linkData) ;
        if(!cb){
            cb = tables;
        }

        module.exports.update(pgClient, userId, linkData, function(err, data){
            console.log('BACK1:link.updateAndGet', data) ;
            if(err){
                cb(err, false);
            } else {
                module.exports.get(pgClient, linkData.lid, tables, cb);
            }

        });
    }, deleteImageAndGet : function(pgClient, userId, linkId, tables, cb){
        if(!cb){
            cb = tables;
        }

        var link = {
            lid : linkId,
            imageId : module.exports.IMAGE_DELETE
        };

        module.exports.update(pgClient, userId, link, function(err, data){
            if(err){
                cb(err, false);
            } else {
                module.exports.get(pgClient, linkId, tables, cb);
            }

        });
    }
}