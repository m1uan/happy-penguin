var Async = require('async'),
    SL = require(process.cwd() + '/lib/happy/sqllib.js');
var pg = null;

module.exports = {

    // init
    $init : function(server, Hapi){
        pg = server.pgClient;

    },
    // get Hapi Config
    $getConfig : function(){
        return {
            params : '{params*}'

        }
    },users_get : function(request){
        var sql = new SL.SqlLib('usr', ['id, name, full_name, last_login'
            ,'(SELECT count(*) FROM word WHERE usr=id) as num_words'
            ,'(SELECT count(*) FROM link WHERE usr=id AND image IS NOT NULL) as num_images'
            ,'(SELECT max(uts) FROM word WHERE usr=id) as last_edit'
        ]);
        sql.whereAnd('id>2');
        sql.select(pg, function(err, data){
            request.reply(err ? err : data);
        });

        //request.reply('ahoj');

    },index_get : function(request){
        if(!request.params){
            request.reply.view('stats');
            return;
        }

        var params = request.params.params.split('/');



        if(params.length > 1 && params[0].length > 0 && params[1].length > 0){


            Async.waterfall([
                  function(icb){
                        var sql;
                        sql =
                        'SELECT link, lang'
                           // + ' ,(SELECT w1.record || \'->\' || w2.record FROM link '
                          //+ ' JOIN word w1 ON link.lid=w1.link'
                         // + ' JOIN word w2 ON link.lid=w2.link'
                           // + ' WHERE w1.usr=$1 AND w2.usr > 0 AND w2.usr != w1.usr AND link.lesson = $2) as conflict'
                        + ' FROM word JOIN link ON link.lid=word.link WHERE word.usr=$1 AND link.lesson=$2'
                        +' UNION ' +
                        'SELECT lid, null as lang'
                            //+ ' ,(SELECT count(*) FROM link linkadd where linkadd.usr=$1 and linkadd.lesson=link.lesson AND linkadd.image IS NOT NULL) AS images_add'
                            //+ ' ,(SELECT count(*) FROM link linkdel where linkdel.usr=$1 and linkdel.lesson=link.lesson AND linkdel.image IS NULL) AS image_del'
                        + ' FROM link WHERE link.lesson=$2 AND link.usr=$1';
                        var sqlData = [params[0],params[1]];
                        pg.query(sql, sqlData,icb);
                  },function(arg, icb){
                        var sql = '';
                        var sql1 = ' UNION SELECT word, record, version, null as image, lang, usr, link'
                                    + ' FROM word WHERE ';

                        var sqlWhere1 = '';

                        var sql2 = ' UNION SELECT description as word, \'\' as record, link.version, image.image as image, null as lang, link.usr, lid as link'
                            + ' FROM link JOIN image ON link.image = image.iid WHERE ';
                        var sqlWhere2 = '';

                        console.log(arg.rows);


                        arg.rows.forEach(function(linkData){
                            if(linkData.lang){
                                sqlWhere1 +=' OR (word.link=' + linkData.link + " AND lang='" + linkData.lang + "')";
                            } else {
                                sqlWhere2 += ' OR link.lid=' + linkData.link;
                            }

                        });

                        if(sqlWhere1){
                            sql = sql1 + sqlWhere1.substring(3);
                        }

                        if(sqlWhere2) {
                            sql += sql2 + sqlWhere2.substring(3) ;
                        }
                        sql += ' order by link';
                        console.log(sql);

                        var sql = sql.substring(7);
                        var sqlData = [params[0],params[1]];
                        pg.query(sql,icb);
                }
            ], function(err, results){
                console.log(err, results);
                request.reply(err ? err : [results.rows]);
            })



        }
        else if(params.length > 0 && params[0].length > 0){

            var sql = 'SELECT lesson,count(*),max(word.uts),min(word.uts)'
                //+ ' ,(' + sql2 + ')'
                + ' ,(SELECT count(*) FROM link linkadd WHERE linkadd.usr=$1 and linkadd.lesson=link.lesson AND linkadd.image IS NOT NULL) AS images_add'
                + ' ,(SELECT count(*) FROM link linkdel WHERE linkdel.usr=$1 and linkdel.lesson=link.lesson AND linkdel.image IS NULL) AS image_del'
                + ' ,(SELECT count(*) FROM link linkconf WHERE linkconf.usr=$1 and linkconf.lesson=link.lesson '
                + ' AND ( linkconf.version != 0 OR (SELECT usr FROM link lch WHERE lch.lid=linkconf.lid AND lch.version != 0 AND lch.usr != $1 LIMIT 1) != 1 )) AS image_conf'
                + ' FROM word JOIN link ON link.lid=word.link WHERE word.usr=$1 group BY lesson ORDER BY lesson';
            var sqlData = [params[0]]
            pg.query(sql, sqlData, function(err, data){
                console.log(err, sql, sqlData[0]);
                var sql2 = ', (SELECT count(*) FROM link '
                            + ' JOIN word w1 ON link.lid=w1.link'
                            + ' JOIN word w2 ON link.lid=w2.link'
                            + ' WHERE w1.usr=$1 AND w2.usr > 1 AND w2.usr != w1.usr AND link.lesson ='
                var sql2tail = ') AS lesson_';
                var sql3 = '';
                if(!err && data.rows && data.rows.length > 0){
                    data.rows.forEach(function(row, idx){
                        sql3 += sql2 + row.lesson + sql2tail + row.lesson;
                    });
                    sql3 = 'SELECT ' + sql3.substring(2);
                    pg.query(sql3, sqlData, function(err, conflicts){
                        console.log(err, conflicts ,sql3);
                        if(!err){
                            data.rows.forEach(function(row, idx){
                                data.rows[idx].conflicts = conflicts.rows[0]['lesson_'+data.rows[idx].lesson];
                                //
                            });
                        }



                        request.reply(err ? err : data.rows);
                    });
                } else {
                    request.reply(err ? err : data.rows);
                }


            });
        }

    }
}