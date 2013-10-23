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
    , update : function(pgClient, userId, link, cb){

        if(!link || !link.lid){
            throw 'parameter link must contain property : lid';
        }

        var linkId = link.lid;
        var hasUpdated = false;
        function selectOld(icb){
            var sql = null;
            if(!link.description || !link.image && link.image != ''){
                sql = 'SELECT description, image FROM link WHERE lid = $1 AND version = 0';
            }


            if(sql){
                console.log(sql)  ;
                pgClient.query(sql, [linkId], function(err, data){
                    var row = data && data.rows && data.rows.length > 0 ? data.rows[0] : null;

                    console.error(linkId);
                    console.error(data);

                    if(err || !row){
                        icb('error or the link dont select : ' + linkId, false);
                    }



                    link.description  = row.description;
                    if(link.image != module.exports.IMAGE_DELETE){
                        link.image  = row.image;
                    }


                    icb(err, link);
                });
            } else {
                icb(null, link);
            }


        }

        function moveToHistory(icb){
            var sql = 'UPDATE link SET version = (SELECT max(version)+1 FROM link WHERE lid = $1) WHERE lid = $1 AND version = 0;';

            console.log(sql)  ;
            pgClient.query(sql, [linkId], function(err, data){
                if(err ){
                    icb(err || 'no update row', false);
                } else {
                    icb(null, link);
                }
            });
        }

        function tryUpdateOld(icb){
            var image = null;

            if(link.image !== module.exports.IMAGE_DELETE){
                image = link.image;
            }

            var sql = 'UPDATE link SET version = 0, usr = $4 WHERE lid = $1 AND image = $2 AND description = $3;';
            console.log(sql)  ;
            pgClient.query(sql, [linkId, image, link.description, userId], function(err, data){
                if(err ){
                    icb(err || 'no insert row', false);
                } else {
                    console.error(data);
                    // updated
                    hasUpdated = data.rowCount > 0;
                    icb(null);
                }
            });
        }


        function createNew(icb){
            console.log('has updated');
            console.log(hasUpdated);

            var image = null;

            if(link.image !== module.exports.IMAGE_DELETE){
                image = link.image;
            }

            // skip insert new because have
            // been updated by tryUpdateOld
            if(hasUpdated){

                icb(null, hasUpdated);
                return;
            }

            var sql = 'INSERT INTO link (lid,image,description,usr) VALUES($1,$2,$3,$4);';
            console.log(sql)  ;
            pgClient.query(sql, [linkId, image, link.description, userId], function(err, data){
                if(err ){
                    icb(err || 'no insert row', false);
                } else {
                    icb(null, link);
                }
            });
        }




        async.series([
            selectOld
            ,moveToHistory
            , tryUpdateOld
            ,createNew
        ], cb);


    }, get : function(pgClient, linkId, tables, cb){

        if(!cb){
            cb = tables;
        }

        var sql = 'SELECT lid,description, link.usr, version, image.image as image, image.iid as iid FROM link LEFT JOIN image ON image.iid = link.image WHERE lid = $1;';
        console.log(sql)  ;
        pgClient.query(sql, [linkId], function(err, data){
            if(err ){
                cb(err, false);
            } else {
                cb(null, data.rows);
            }
        });

    }, updateAndGet : function(pgClient, userId, linkData, tables, cb){
        if(!cb){
            cb = tables;
        }

        module.exports.update(pgClient, userId, linkData, function(err, data){
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
            image : module.exports.IMAGE_DELETE
        };

        module.exports.update(pgClient, userId, link, function(err, data){
            if(err){
                cb(err, false);
            } else {
                module.exports.get(pgClient, linkId, tables, cb);
            }

        });
    },
}