drop table deleted_t;
CREATE TABLE deleted_t (
    cnt INTEGER DEFAULT 1,
    link INTEGER NOT NULL,
    lang1 CHAR(2) NOT NULL,
    lang2 CHAR(2) NOT NULL,
    word1 TEXT NOT NULL,
    word2 TEXT NOT NULL,
    image VARCHAR(100) DEFAULT NULL,
    changed TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    debug INTEGER DEFAULT 0,
    PRIMARY KEY(link,lang1,lang2,word1,word2,image,debug)
);