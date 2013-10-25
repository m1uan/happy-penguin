
-- psql -c "CREATE USER uservoc4u WITH PASSWORD '*uservoc4u'" postgres
-- psql -c 'ALTER ROLE uservoc4u CREATEDB CREATEROLE INHERIT LOGIN' postgres
-- psql -U uservoc4u -c 'CREATE DATABASE voc4u;' postgres
-- psql -U uservoc4u -c 'ALTER DATABASE voc4u OWNER TO uservoc4u' postgres

-- CREATE DATABASE voc4u;
-- CREATE USER uservoc4u WITH PASSWORD '*uservoc4u';
-- GRANT ALL PRIVILEGES ON DATABASE voc4u TO uservoc4u;
-- ALTER ROLE uservoc4u CREATEDB CREATEROLE INHERIT LOGIN;
-- psql -U uservoc4u -d voc4u -f initdata/init.sql
-- ALTER DATABASE name OWNER TO new_owner

drop table word;
drop table link;
drop table image;
drop table usr;


CREATE TABLE usr (
   id SERIAL UNIQUE NOT NULL,
   name VARCHAR(25) NOT NULL,
   pass VARCHAR(25) NOT NULL,
   full_name VARCHAR(100) NOT NULL,
   PRIMARY KEY(id, name)
);

INSERT INTO usr (name, pass, full_name) VALUES ('init','no password at all', 'inital');

CREATE TABLE image (
    iid SERIAL NOT NULL,
    image VARCHAR(255),
    md5 VARCHAR(255),
    usr INTEGER NOT NULL DEFAULT 1,
    PRIMARY KEY(iid)
);




CREATE TABLE link (
    -- link id
    lid INTEGER NOT NULL,
    description TEXT,
    image INTEGER DEFAULT NULL,
    usr INTEGER NOT NULL DEFAULT 1,
    lesson SMALLINT NOT NULL,
    version SMALLINT NOT NULL DEFAULT 0,
    PRIMARY KEY(lid, version)
);



CREATE TABLE word (
    lang CHAR(2) NOT NULL,
    word TEXT NOT NULL,
    link INTEGER NOT NULL,
    usr INTEGER NOT NULL DEFAULT 1,
    FOREIGN KEY (usr) REFERENCES usr (id) ,
    version SMALLINT NOT NULL DEFAULT 0,
    PRIMARY KEY(lang, link, version)
);







-- select link,word,'w' as type, lang from word where link > 10 and link < 15 union select link,image,'i' as type, '' as lang from image where link > 10 and link < 15;
-- link |                                 word                                 | type | lang
--------+----------------------------------------------------------------------+------+------
--   13 | comprobar                                                            | w    | es
--   11 | Kuchen                                                               | w    | de
--   11 | cake                                                                 | w    | en
--   14 | šachy                                                                | w    | cs
--   13 | check                                                                | w    | en
--   11 | dort                                                                 | w    | cs
--   12 | povídat                                                              | w    | cs
--   11 | ANd9GcTnI4XGBKnmfsg9Y3UFZS4mKmbkPQvsgb7wFUQdX2hMcDqaNzVy8vLor-A0.jpg | i    |
--   14 | ANd9GcT5wkG5QlniXGD3Fl3RjXhcu7iRpbaOqz-JBwkXAfhA0qlrLacivxNSyIY9.jpg | i    |
--   14 | ajedrez                                                              | w    | es
--   12 | charlar                                                              | w    | es
--   13 | überprüfen                                                           | w    | de
--   14 | Schach                                                               | w    | de
--   11 | pastel                                                               | w    | es
--   13 | kontrola                                                             | w    | cs
--   12 | chat                                                                 | w    | en
--   14 | chess                                                                | w    | en
--   12 | Chat                                                                 | w    | de
--   13 | ANd9GcRWsY8XhHZrS2lL4EipJvYhg73vzD9EJ6msDQMkb_mStIrOhXkhkwB91znY.jpg | i    |

--select word.word as word1cs, w2.word as word2en, word.lang, w2.lang, image.image from word  left join word w2 on word.link = w2.link left join image on word.link=image.link where word.lang='cs' and w2.lang='en' and word.link > 10 and word.link < 25;
--    word1cs     |    word2en     | lang | lang |                                 image
------------------+----------------+------+------+------------------------------------------------------------------------
-- dort           | cake           | cs   | en   | ANd9GcTnI4XGBKnmfsg9Y3UFZS4mKmbkPQvsgb7wFUQdX2hMcDqaNzVy8vLor-A0.jpg
-- povídat        | chat           | cs   | en   |
-- kontrola       | check          | cs   | en   | ANd9GcRWsY8XhHZrS2lL4EipJvYhg73vzD9EJ6msDQMkb_mStIrOhXkhkwB91znY.jpg
-- šachy          | chess          | cs   | en   | ANd9GcT5wkG5QlniXGD3Fl3RjXhcu7iRpbaOqz-JBwkXAfhA0qlrLacivxNSyIY9.jpg
-- studený nápoj  | cold drink     | cs   | en   | ANd9GcQrPe-LSWKmy4riNjShg1VRjB1ZSomFZHWm1znb0AWW778zhf-qJuCucls.jpg
-- Tak pojď!      | Come on!       | cs   | en   |
-- komunikovat    | communicate    | cs   | en   | ANd9GcTdtmoB6Us_0c2XrTR8gT8XesXWHNIBCLJRwdZQ8ugXXq-M_b1eiHjyNh4eeQ.jpg
-- počítačové hry | computer games | cs   | en   | ANd9GcREWPc7HNRkA-plQCdcPsOTb9_fq0YT1l5wSdYsJyydyRJRj_2TPJfulKw.jpg
-- nekonečný      | endless        | cs   | en   |
-- promiňte       | excuse me      | cs   | en   |
-- květiny        | flowers        | cs   | en   | ANd9GcQKIPPp_Uw7rurvt5J_5sC5NxUTbtZ6m4Oj947WDshvY9ta_EU4m91Vq8o.jpg
-- předpověď      | forecast       | cs   | en   | ANd9GcSCOmvFvTWi3IV0Pd2z_5qoUvG6yqdbzDbb-N6J2Gl5GVxPHu1GXKXr_J2d.jpg
-- historie       | version        | cs   | en   |
-- tlumočník      | interpreter    | cs   | en   |
--(14 rows)


-- http://tools.perceptus.ca/text-wiz.php
BEGIN;

INSERT INTO usr (name, pass, full_name) VALUES ('admin','a', 'Administrator');
INSERT INTO usr (name, pass, full_name) VALUES ('miuan','a', 'Milan Medlik');
INSERT INTO usr (name, pass, full_name) VALUES ('klara','a', 'Klara Dvorakova');



COMMIT;

GRANT ALL ON link TO uservoc4u;
GRANT ALL ON usr TO uservoc4u;
GRANT ALL ON word TO uservoc4u;
GRANT ALL ON image TO uservoc4u;
GRANT USAGE, SELECT ON SEQUENCE image_iid_seq TO uservoc4u;
GRANT USAGE, SELECT ON SEQUENCE link_lid_seq TO uservoc4u;

SELECT pg_size_pretty(pg_database_size('voc4u'));
