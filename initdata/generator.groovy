listFiles = [];
def listWords = [];


def findOrCreateFile(file) {

    checksum = checkSum('img/' + file); 
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
    word = [word : splited[0].trim(), lid : count++, lang : lng];
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

def lang = ['en'];
def lesson = [1005];

lang.each{
    lng = it;
    count = 1;
    lesson.each{ lsn ->
        def path = "outdatanew/${lng}/${lsn}.data";
        println path; 
        def sed = 'sed -i \'${/^$/d;}\' ' + path;
        sed.execute();
        println sed;
        myFile = new File(path);
        myFile.eachLine( printFileLine )
    }
    }


    new File("foo.sql").withWriter { out ->
    out.writeLine("begin;");
    out.writeLine("\n\nINSERT INTO image ( id, md5, file ) VALUES ");
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
            sqlvalues += ",(${word.link},'${word.word}','${word.lang}')\n";
        }
    }

    sqlvalues = sqlvalues.substring(1) + ";";
    out.writeLine(sqlvalues);
    
    out.writeLine("\n\nINSERT INTO link ( lid, description, image ) VALUES ");
    sqlvalues = ""; 
    listWords.each { word ->
        if(word.lang == 'en'){
        sqlvalues += ",(${word.lid},'${word.word}',"
        if(word.file) { sqlvalues += "'${word.file.id}'"}
        else {sqlvalues += "NULL"};
        sqlvalues += ")\n";
        }
    }

    sqlvalues = sqlvalues.substring(1) + ";";
    out.writeLine(sqlvalues);
    out.writeLine("commit;");
    }

//checkSum('img/a_broken_arm_1376385342982.jpg');
