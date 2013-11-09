


module.exports.getPackageForUpdate = function(pg, cb){
    var sql = 'SELECT changed, lesson, lang_mask FROM update_package';
    console.log(sql);
    pg.query(sql, function(err, data){
        cb(err, data.rows);
    });
}