DROP TABLE IF EXISTS pinguin.question_t;
DROP TABLE IF EXISTS pinguin.place_t;
DROP SCHEMA IF EXISTS pinguin;


ALTER TABLE translates.lang_t DROP COLUMN IF EXISTS link;
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
    "key" VARCHAR(50) DEFAULT NULL,
    "desc" TEXT,
    "group" INT DEFAULT 0,
    changed TIMESTAMP DEFAULT now(),
    PRIMARY KEY(link),
    UNIQUE("key")
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


ALTER TABLE translates.lang_t ADD COLUMN link INTEGER;
ALTER TABLE translates.lang_t ADD FOREIGN KEY (link) REFERENCES translates.link_t (link);



CREATE SCHEMA pinguin

CREATE TABLE place_t (
    id SERIAL NOT NULL,
    posx FLOAT NOT NULL,
    posy FLOAT NOT NULL,
    name INTEGER NOT NULL,
    FOREIGN KEY (name) REFERENCES translates.link_t (link),
    "info" INTEGER DEFAULT NULL,
    FOREIGN KEY (info) REFERENCES translates.link_t (link),
    PRIMARY KEY(id)
)


CREATE TABLE question_t (
    qid SERIAL NOT NULL,
    place_id INT,
    FOREIGN KEY (place_id) REFERENCES pinguin.place_t (id),
    question INTEGER NOT NULL,
    FOREIGN KEY (question) REFERENCES translates.link_t (link),
    answers INTEGER NOT NULL,
    FOREIGN KEY (answers) REFERENCES translates.link_t (link),

    PRIMARY KEY(qid)
);