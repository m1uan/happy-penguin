var Config = require('../../config/local.js');

var SqlLib = function(table, mfields){
    var where  = '';
    var sqlData = [] ;
    var sqljoin = '';
    var sqlOrderBy = [];
    var sqlGroupBy = [];

    if(!mfields){
        mfields = ['*'];
    }

    this.whereAnd = function(expression, expressionValue){
        if(!where){
            where = 'WHERE '
        } else {
            where += ' AND ';
        }

        if(!expressionValue && expressionValue !== 0){
            where += expression;

        } else {
            // expresion is without value
            // value is in expressionValue
            sqlData.push(expressionValue);
            where += expression +'$'+sqlData.length;
        }

        return this;
    }

    this.whereIn = function(expression, expressionValue){
        if(!where){
            where = 'WHERE '
        } else {
            where += ' AND ';
        }

        var j = expressionValue.join(',');
        where += expression +' IN ('+j+')';


        return this;
    }

    this.joinRight = function (join, expression) {
        if(sqljoin){
            sqljoin += ' ';
        }

        // must be left join otherwise
        // the link images return just link with images not null
        sqljoin += ' JOIN ' + join + ' ON ' + expression;
        return this;
    }

    this.join = function (join, expression) {
        if(sqljoin){
            sqljoin += ' ';
        }

        // must be left join otherwise
        // the link images return just link with images not null
        sqljoin += 'LEFT JOIN ' + join + ' ON ' + expression;
        return this;
    }

    this.generateSelect = function(){
        var sql = 'SELECT ' + mfields.join(',') + ' FROM ' + table;
        if(sqljoin) {
            sql += ' ' + sqljoin;
        }

        if(where) {
            sql += ' ' + where;
        }

        var orderBy = sqlOrderBy.join(',');
        if(orderBy){
            sql += ' ORDER BY ' + orderBy;
        }

        var groupBy = sqlGroupBy.join(',');
        if(groupBy){
            sql += ' GROUP BY ' + groupBy;
        }

        return sql;
    }

    this.select = function(pg, callback){

        var sql = this.generateSelect();

        pg.query(sql, sqlData, function(err, data){
            if(Config.debug){
                console.log(err ? '#sql-generator-ERROR:':'#sql-generator:', sql, sqlData, err ?  err : '',data);
            }
            callback(err, data ? data.rows : null);
        });

    }

    function cleanColumn(column){
        if(column.indexOf('?') == 0 || column.indexOf('!') == 0){
            return column.substring(1);
        } else {
            return column;
        }
    }


    /**
     * if column start '?' mean is not conditional
     * speacialy in upsert {col1: 'ahoj','col2': 'user1', '?col3'='now()'} =>
     * UPDATE table SET col3='now()' WHERE col2='user1' AND col1='ahoj'
     * @param column
     * @returns {0 - conditional - must be in condition in update
     *          1 - unconditional - have to be outside condition in update}
     */
    function conditionalColumn(column){
        return column.indexOf('?') == 0 ? 1 : 0;
    }

    // command column should be in insert
    // because is used in upsert cnt = cnt + 1
    // what doesnt work with insert
    function isInsertColumn(column){
        return !isCommandColumn(column);
    }

    function isCommandColumn(column){
        return column.indexOf('!') == 0 ? 1 : 0;
    }

    function mysql_real_escape_string (str) {
        return str.replace(/[\0\x08\x09\x1a\n\r"'\\\%]/g, function (char) {
            switch (char) {
                case "\0":
                    return "\\0";
                case "\x08":
                    return "\\b";
                case "\x09":
                    return "\\t";
                case "\x1a":
                    return "\\z";
                case "\n":
                    return "\\n";
                case "\r":
                    return "\\r";
                case "\"":
                case "'":
                case "\\":
                case "%":
                    return "\\"+char; // prepends a backslash to backslash, percent,
                // and double/single quotes
            }
        });
    }

    function generateInsert(insertData, upsert){

        var columnNames = '';
        var valuesId = '';
        var idx = 0;
        for(var column in insertData) {
            if (insertData.hasOwnProperty(column) && isInsertColumn(column)) {
                columnNames += ',' + cleanColumn(column);

                // in upsert was data add already in update... #look_update
                //if(!upsert){
                //    sqlData.push(insertData[column]);
                //}
                idx++;
                if(typeof insertData[column] == 'string' || insertData[column] instanceof String) {
                    valuesId += ",E'" + mysql_real_escape_string(insertData[column]) + "'";
                } else {
                    valuesId += ",'" + insertData[column] + "'";
                }

            }

        }

        var sql = 'INSERT INTO ' + table + ' (' + columnNames.substring(1) + ')'
        if(!upsert){
            sql += 'VALUES(' + valuesId.substring(1) + ')';
        } else {
            sql += 'SELECT ' + valuesId.substring(1);
        }

        return sql;
    }



    function generateUpdate(updateData){

        var columnNames = '';

        for(var column in updateData) {
            if (updateData.hasOwnProperty(column)) {
                columnNames += ',' + cleanColumn(column) +"=";

                var command = isCommandColumn(column);


                if(command) {
                     columnNames += updateData[column];
                } else if(updateData[column] == null) {
                    columnNames += "null";
                } else if(typeof updateData[column] == 'string' || updateData[column] instanceof String) {
                    columnNames += "E'" + mysql_real_escape_string(updateData[column]) + "'";
                } else {
                    columnNames += "'" + updateData[column] + "'";
                }

                // #look_update
                //sqlData.push(updateData[column]);

            }

        }

        var sql = 'UPDATE ' + table + ' SET ' + columnNames.substring(1) + ' ';



        return sql;
    }

    this.update = function (pg, updateData, callback){
        var sql = generateUpdate(updateData);
        var sqlReturning = ''
        for(var column in updateData) {
            sqlReturning += ',' + column;
        }

        sql += where;

        if(sqlReturning){
           sql +=  ' RETURNING ' + sqlReturning.substr(1);
        }



        pg.query(sql, function(err, data){
            if(Config.debug){
                console.log(err ? '#sql-generator-ERROR:':'#sql-generator:', sql, err ?  err : '',data);
            }
            callback(err, data ? data.rows : null);
        });
    }

    /**
     * generate SQL for upsert
     * @param uiData - format : {col1:'data1',col2:'data2}
     * @param returning - format : ['col1','col2']
     * @returns {string}
     */
    this.generateUpsert = function(uiData, returning){
        var updateSql = generateUpdate(uiData);
        //var updateSql = updateData.shift();

        var insertSql = generateInsert(uiData, true);
        //var insertSql = insertData.shift();



        var notExists = new SqlLib(table,['1']);
        //notExists.whereAnd(where);
        for(var column in uiData) {
            if (uiData.hasOwnProperty(column) ) {
                // must add where fit value
                // because $1, $2, ... will be reachable from (SQL)notExists
                // but we have $1, $2, ... in our scope (SQL)this
                //notExists.whereAnd(cleanColumn(column)+"='"+uiData[column]+"'");
            }
        }

        var notExistSql = '('+ notExists.generateSelect();
        //if(where) {
        //    notExistSql += ' ' + where;
        //}


        if(where) {
            updateSql += ' ' + where;
            // in noExistsSql is WHERE like -> WHERE col1='1' AND col2='3'
            // we want add also our where -> so replace with WHERE col0=$1
            // -> WHERE col0=$1 AND col1='1' AND col2='3
            notExistSql += ' ' + where;
        }

        notExistSql += ')';

        insertSql += ' WHERE NOT EXISTS ' + notExistSql;

        if(returning.length > 0){
            var returing = '';

            returning.forEach(function(ret){
                returing += ',' + ret;
            });

            returning = ' RETURNING ' + returing.substring(1);
            insertSql += returning;
            updateSql += returning;
        }

        var finalsql = updateSql + ';' + insertSql + ';';

        return finalsql;
    }

    this.upsert = function(pg, uiData, returning, callback){
        // WORKING SAMPLE
        // update word set word='ahoj' where lang='cs' and link=1234 returning word;insert into word (link,lang,word) select 1234,'cs','ahoj2' where not exists(select 1 from word where link=1234 and lang='cs') returning word;
        // from here http://stackoverflow.com/questions/1109061/insert-on-duplicate-update-postgresql
        if(!callback){
            callback = returning;
            returning = [];
        }

        var finalsql = this.generateUpsert(uiData, returning);

        pg.query(finalsql, sqlData, function(err, data){
            if(Config.debug){
                console.log(err ? '#sql-generator-ERROR:':'#sql-generator:', finalsql, sqlData, err ?  err : '',data);
            }
            callback(err, data ? data.rows : null);
        });
    }

    this.fields = function(f){
        mfields = f;
        return this;
    }

    this.addOrderBy = function(field){
        sqlOrderBy.push(field);
        return this;
    }

    this.addGroupBy = function(field){
        sqlGroupBy.push(field);
        return this;
    }

    return this;
}


module.exports.SqlLib = SqlLib;