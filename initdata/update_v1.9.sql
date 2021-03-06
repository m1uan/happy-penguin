DROP TABLE IF EXISTS pinguin.place_info_t;
DROP TABLE IF EXISTS pinguin.place_info_type_t;
ALTER TABLE pinguin.place_t DROP COLUMN IF EXISTS place_info;
ALTER TABLE link DROP COLUMN IF EXISTS usage;

CREATE TABLE pinguin.place_info_type_t (
    pit SERIAL NOT NULL,
    name TEXT NOT NULL,
    PRIMARY KEY(pit)
);

INSERT INTO pinguin.place_info_type_t (name) VALUES
    ('City'),
    ('Joke'),
    ('Quote'),
    ('Battle'),
    ('History'),
    ('Story');

CREATE TABLE pinguin.place_info_t (
    pi SERIAL NOT NULL,
    name INTEGER DEFAULT NULL,
   "info" INTEGER DEFAULT NULL,
   "type" INTEGER NOT NULL DEFAULT 1,
    FOREIGN KEY (name) REFERENCES translates.link_t (link),
    FOREIGN KEY (info) REFERENCES translates.link_t (link),
    FOREIGN KEY (type) REFERENCES pinguin.place_info_type_t (pit),
    PRIMARY KEY (pi)
);

CREATE TABLE pinguin.place_info_size_t (
    pi INTEGER NOT NULL,
    lang VARCHAR(2) NOT NULL,
    "size" SMALLINT,
    FOREIGN KEY (lang) REFERENCES translates.lang_t (lang) ,
    FOREIGN KEY (pi) REFERENCES pinguin.place_info_t (pi),
    PRIMARY KEY (pi, lang)
);

ALTER TABLE pinguin.place_t ADD COLUMN place_info INTEGER;
ALTER TABLE pinguin.place_t ADD FOREIGN KEY (place_info) REFERENCES pinguin.place_info_t (pi);
ALTER TABLE pinguin.place_t ALTER COLUMN name DROP NOT NULL;

ALTER TABLE link ADD COLUMN usage INTEGER DEFAULT NULL;
ALTER TABLE link ADD COLUMN issentence BOOLEAN DEFAULT NULL;

CREATE TABLE link_sentence_t (
    sentence INTEGER NOT NULL,
    word INTEGER NOT NULL,
    PRIMARY KEY (sentence, word)
);

ALTER TABLE translates.lang_t ADD COLUMN status SMALLINT NOT NULL DEFAULT 0;

UPDATE translates.lang_t SET status=1 WHERE lang='cz' OR lang='en';