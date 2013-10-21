listFiles = [];
def listWords = [];


def findOrCreateFile(file) {

    checksum = checkSum('img/' + file); 
    if(checksum.size() < 5) {
	return null;
    }
    listFiles.each{
        if(it.md5 == checksum){
            return it;
            }
        }
    
    def copy = "cp img/$file imgnew/$file";
    def process = copy.execute();
    //println copy;
    
    file = [md5:checksum, name: file, id: listFiles.size()+1];
    listFiles.add( file);

    
    return file;
    }

printFileLine = { 
splited = it.split(";");
def	w = splited.size() > 0 ? splited[0] : it;

w = w.trim().replace("'","\\'");
    word = [word : w, lid : count++, lang : lng];
    if( splited.size() > 1 && splited[1] != ''){
        word.file = findOrCreateFile(splited[1]);
        }
    listWords.add(word);
    //println word;

//println splited;
}

def checkSum(file){
    //println "md5sum ${file}";
    def process = "md5sum ${file}".execute()
    def sum = process.text.split(" ");
    //println "Found text ${sum[0]} ${sum}"
    return sum[0];
    }

def lang = ['en','cs','es','pt','it', 'de'];
def lesson = [ 1001, 1002, 1003,1004, 1005, 2001, 2002, 2003, 2004, 2005, 2006, 2007, 2008, 3001, 3002, 3003, 3004, 3005, 3007, 3008, 4001, 4002, 4003, 4004, 4005, 4006, 4007, 4008, 4009, 4010 ];
def lang1 = ['en'];
def lesson1 = [ 1001, 1002, 4010 ];

lang.each{
    lng = it;
    count = 1;
    lesson.each{ lsn ->
        def path = "outdatanew/${lng}/${lsn}.data";
        println path; 
	def sed = 'sed -i -e :a -e \'/^\\n*$/{$d;N;ba\' -e \'}\' ' + path
        sed.execute();
        println sed;
        myFile = new File(path);
        myFile.eachLine( printFileLine )
    }
    }


    new File("foo.sql").withWriter { out ->
    out.writeLine("delete from word;");
    out.writeLine("delete from link;");
    out.writeLine("delete from image;");
    out.writeLine("begin;");
    out.writeLine("\n\nINSERT INTO image ( iid, md5, image ) VALUES ");
    def sqlvalues = ""; 
    listFiles.each { file ->
        sqlvalues += ",(${file.id},'${file.md5}','${file.name}')\n";
    }

    sqlvalues = sqlvalues.substring(1) + ";";
    out.writeLine(sqlvalues);

    out.writeLine("\n\nINSERT INTO word ( link, word, lang ) VALUES ");
    sqlvalues = ""; 
    listWords.each { word ->
        if(word.word){
            sqlvalues += ",(${word.lid}," + 'E\'' + word.word+ '\'' + ", '${word.lang}')\n";
        }
    }

    sqlvalues = sqlvalues.substring(1) + ";";
    out.writeLine(sqlvalues);
    
    out.writeLine("\n\nINSERT INTO link ( lid, description, image ) VALUES ");
    sqlvalues = ""; 
    listWords.each { word ->
        if(word.lang == 'en'){
	w =  word.word ? 'E\'' + word.word + '\'' : "''";
       	 sqlvalues += ",(${word.lid}," + w + ','
        if(word.file) { sqlvalues += "${word.file.id}"}
        else {sqlvalues += "NULL"};
        sqlvalues += ")\n";
        }
    }

    sqlvalues = sqlvalues.substring(1) + ";";
    out.writeLine(sqlvalues);
    out.writeLine("commit;");
    out.writeLine("SELECT pg_size_pretty(pg_database_size('voc4u'));");
    }

//checkSum('img/a_broken_arm_1376385342982.jpg');
