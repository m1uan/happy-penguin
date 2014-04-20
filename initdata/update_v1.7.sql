

DROP TABLE IF EXISTS translates.translate_t;
DROP TABLE IF EXISTS translates.link_t;
DROP TABLE IF EXISTS translates.lang_t;
DROP SCHEMA IF EXISTS translates;

CREATE SCHEMA translates

CREATE TABLE lang_t (
      lang CHAR(2) NOT NULL,
      name VARCHAR(25) NOT NULL,
      PRIMARY KEY(lang)
)

CREATE TABLE link_t (
    link SERIAL NOT NULL,
    key VARCHAR(50) NOT NULL,
    description TEXT,
    changed TIMESTAMP DEFAULT now(),
    PRIMARY KEY(link),
    UNIQUE(key)
)

CREATE TABLE translate_t (
    lang CHAR(2) NOT NULL,


    link INTEGER NOT NULL,
    FOREIGN KEY (lang) REFERENCES translates.lang_t (lang) ,
    FOREIGN KEY (link) REFERENCES translates.link_t (link),
    data TEXT,
    changed TIMESTAMP DEFAULT now(),
    PRIMARY KEY(lang, link)
)



;


