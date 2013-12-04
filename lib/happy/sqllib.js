var Config = require('../../config/local.js');

var SqlLib = function(table, mfields){
    var where  = '';
    var sqlData = [] ;
    var sqljoin = '';
    var sqlOrderBy = [];

    if(!mfields){
        mfields = [];
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
        if(column.indexOf('?') == 0){
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

    function generateInsert(insertData, upsert){

        var columnNames = '';
        var valuesId = '';
        var idx = 0;
        for(var column in insertData) {
            if (insertData.hasOwnProperty(column)) {
                columnNames += ',' + cleanColumn(column);

                // in upsert was data add already in update... #look_update
                //if(!upsert){
                //    sqlData.push(insertData[column]);
                //}
                idx++;
                valuesId += ",'" + insertData[column] + "'";
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
                columnNames += ',' + cleanColumn(column) +"='" + updateData[column] + "'";
                // #look_update
                //sqlData.push(updateData[column]);

            }

        }

        var sql = 'UPDATE ' + table + ' SET ' + columnNames.substring(1);



        return sql;
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
        for(var column in uiData) {
            if (uiData.hasOwnProperty(column)) {
                // must add where fit value
                // because $1, $2, ... will be reachable from (SQL)notExists
                // but we have $1, $2, ... in our scope (SQL)this
                notExists.whereAnd(cleanColumn(column)+"='"+uiData[column]+"'");
            }
        }


        var notExistSql = '('+ notExists.generateSelect()+')';

        if(where) {
            updateSql += ' ' + where;
            // in noExistsSql is WHERE like -> WHERE col1='1' AND col2='3'
            // we want add also our where -> so replace with WHERE col0=$1
            // -> WHERE col0=$1 AND col1='1' AND col2='3
            notExistSql.replace('WHERE', where);
        }

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
    }

    return this;
}


module.exports.SqlLib = SqlLib;