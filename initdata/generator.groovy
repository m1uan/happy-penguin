listFiles = [];
def listWords = [];

def lang1 = ['ar','bg','cs','da','de','el','en','es','et','fi','fr','he','hi','hu','id','it','ja','ko','lt','lv','ms','nl','no','pl','pt','ro','ru','sl','sv','th','tr','uk','vi','zh'];
//def lang = ['en','cs','es','pt','it', 'de','ar','zh','ru'];
def lessons1 = [ 101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 1001, 1002, 1003,1004, 1005, 2001, 2002, 2003, 2004, 2005, 2006, 2007, 2008, 3001, 3002, 3003, 3004, 3005, 3007, 3008, 4001, 4002, 4003, 4004, 4005, 4006, 4007, 4008, 4009, 4010 ];
def lessons = [ 1001, 1002, 1003,1004, 1005, 2001, 2002, 2003, 2004, 2005, 2006, 2007, 2008, 3001, 3002, 3003, 3004, 3005, 3007, 3008, 4001, 4002, 4003, 4004, 4005, 4006, 4007, 4008, 4009, 4010 ];
def lang2 = ['en'];
def lesson2 = [ 4009, 4010 ];
def lang= ['al', 'sk', 'sr', 'hr', 'ba', 'mk'];
def lessons3= [  2004,4001 ];

def findOrCreateFile(fileName) {
    fileName = fileName.trim();
    checksum = checkSum('img/' + fileName); 
    if(checksum.size() < 5) {
	    return null;
    }

    def file = null;
    listFiles.each{it->
    if(it.md5 == checksum){
        //println it.md5;
            //println 'it:' + checksum  + ' ' + listFiles.size();
            file = it; 
            }
        }

    if(!file){
        def copy = "cp img/$file imgnew/$file";
        def process = copy.execute();
        //println copy;

        file = [md5:checksum, name: fileName, id: listFiles.size()+1];
        listFiles.add( file);
        
        //println checksum  + ' ' + fileName + ' ' + listFiles.size();
    }
    return file;
    }

    printFileLine = { 
splited = it.split(";");
def	w = splited.size() > 0 ? splited[0] : it;

w = w.trim().replace("'","\\'");
word = [
word : w,
lid : count++,
lang : lng,
lesson : lesson
];
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


lang.each{
    lng = it;
    count = 1;
    lessons.eachWithIndex(){ lsn,idx ->
        count = (idx+1) * 1000;
        lesson = lsn
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
    //out.writeLine("delete from word;");
    //out.writeLine("delete from link;");
    //out.writeLine("delete from image;");
    out.writeLine("begin;");
    out.writeLine("\n\nINSERT INTO image ( iid, md5, image ) VALUES ");
    def sqlvalues = ""; 
    listFiles.each { file ->
        sqlvalues += ",(${file.id},'${file.md5}','${file.name}')\n";
    }
    println "images done"
    sqlvalues = sqlvalues.substring(1) + ";";

    sqlvalues += 'SELECT setval(\'image_iid_seq\', (select max(iid) from image));'

    out.writeLine(sqlvalues);

    out.writeLine("\n\nINSERT INTO word ( link, word, lang ) VALUES ");
    sqlvalues = "";

	siz = listWords.size();
    percent = siz / 100;
    nextPercent = percent;
    idx = 0;
    listWords.each { word ->
        if(word.word && !word.word.isNumber()){
            sqlvalues += ",(${word.lid}," + 'E\'' + word.word+ '\'' + ", '${word.lang}')\n";
        }

	if( idx++ > nextPercent){
		println "words " + nextPercent + " / " + siz;
		nextPercent+=percent;
	}
    }

    sqlvalues = sqlvalues.substring(1) + ";";
    out.writeLine(sqlvalues);
    
    out.writeLine("\n\nINSERT INTO link ( lid, description, image, lesson ) VALUES ");
    sqlvalues = ""; 
    siz = listWords.size();
    percent = siz / 100;
    nextPercent = percent;
    idx = 0;
    listWords.each { word ->
        if(word.lang == 'en' && !word.word.isNumber()&& word.word !=';'){
	w =  word.word ? 'E\'' + word.word + '\'' : "''";
       	 sqlvalues += ",(${word.lid}," + w + ','
        if(word.file) { sqlvalues += "${word.file.id}"}
        else {sqlvalues += "NULL"};
        sqlvalues += ",${word.lesson}"
        sqlvalues += ")\n";
        }
	if( idx++ > nextPercent){
		println "links " + nextPercent + " / " + siz;
		nextPercent+=percent;
	}
    }

    sqlvalues = sqlvalues.substring(1) + ";";
    out.writeLine(sqlvalues);
    out.writeLine("commit;");
    out.writeLine("SELECT pg_size_pretty(pg_database_size('voc4u'));");
    }

//checkSum('img/a_broken_arm_1376385342982.jpg');
