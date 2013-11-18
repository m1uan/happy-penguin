DROP TRIGGER update_package_link ON link;
DROP TRIGGER update_package_word ON word;

ALTER TABLE word DROP COLUMN record;
ALTER TABLE word ADD COLUMN record VARCHAR(50) DEFAULT NULL;

ALTER TABLE word DROP COLUMN uts; -- update timestamp
ALTER TABLE word ADD COLUMN uts TIMESTAMP DEFAULT current_timestamp;

--ALTER TABLE link DROP COLUMN uts; -- update timestamp
--ALTER TABLE link ADD COLUMN uts TIMESTAMP DEFAULT current_timestamp();



DROP TABLE lang_t;
CREATE TABLE lang_t (
  code SMALLINT NOT NULL,
  lang VARCHAR(2) NOT NULL
);

-- just for fun :-D
CREATE OR REPLACE FUNCTION generate_langs() RETURNS INT AS $$
DECLARE
idx SMALLINT := 1;
cd VARCHAR(2);
BEGIN
      DELETE FROM lang_t;
      FOR cd IN SELECT lang FROM word GROUP BY lang
      LOOP
          INSERT INTO lang_t(code, lang) VALUES
                (idx, cd);
          --UPDATE word SET langid=(SELECT lang FROM t_lang WHERE code = cd) WHERE lang = cd;
          RAISE NOTICE 'cd % %',cd, idx;
          idx:=idx+1;
      END LOOP;
      RETURN idx;
END; $$
LANGUAGE plpgsql;


SELECT generate_langs();

--INSERT INTO t_lang (lang,code) VALUES
--(1::"char", 'ar'),
--(2::"char", 'de'),
--(3::"char", 'cs'),
--(4::"char", 'en');

--UPDATE word SET langid=(SELECT lang FROM t_lang WHERE code = 'de') WHERE lang = 'de';
--UPDATE word SET langid=(SELECT lang FROM t_lang WHERE code = 'cs') WHERE lang = 'cs';
--UPDATE word SET langid=(SELECT lang FROM t_lang WHERE code = 'en') WHERE lang = 'en';


DROP TABLE update_package_t;

CREATE TABLE update_package_t (
   changed TIMESTAMP DEFAULT now(),
   lesson INT,
   lang_mask BIGINT
);


CREATE OR REPLACE FUNCTION get_mask(langvc VARCHAR(2)) RETURNS BIGINT AS $$
DECLARE
result BIGINT;
code SMALLINT;
BEGIN
      code := (SELECT lang_t.code FROM lang_t WHERE lang_t.lang = langvc);
      result := (1 << code);
        RAISE NOTICE 'lang % mask % result %',langvc, code, result;
      RETURN result;
END; $$
LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_link_changed() RETURNS TRIGGER AS $$
DECLARE
    lsn INT;
    -- mask full house ;-)
    mask BIGINT := -1;
BEGIN
    IF TG_TABLE_NAME = 'word' THEN
        lsn := (SELECT link.lesson FROM link WHERE link.lid = NEW.link and version = 0);
    ELSE
        lsn := NEW.lesson;
    END IF;

    IF TG_TABLE_NAME = 'word' THEN
        --code := (SELECT lang_t.code FROM lang_t WHERE lang_t.lang = NEW.lang);
        --RAISE NOTICE 'lesson %',lsn;
        --RAISE NOTICE 'OLD.lang %',NEW;
        -- TODO: switch
        mask := get_mask(NEW.lang);
    END IF;

    --RAISE NOTICE 'PK is %',mask;
    UPDATE update_package_t SET lang_mask= (lang_mask | mask) WHERE update_package_t.lesson=lsn;
    IF NOT FOUND THEN
        INSERT INTO update_package_t (changed, lesson, lang_mask)
            VALUES (now(), lsn, mask );
    END IF;



    RETURN NEW;
END; $$
LANGUAGE plpgsql;


-- just UPDATE because every change first must change version
-- where WHERE version = 0 because there is also change to version max
CREATE TRIGGER update_package_link
   AFTER UPDATE ON link
   FOR EACH ROW WHEN (NEW.version = 0)
   EXECUTE PROCEDURE update_link_changed();

-- just UPDATE because every change first must change version
-- where WHERE version = 0 because there is also change to version max
CREATE TRIGGER update_package_word
      AFTER UPDATE ON word
      FOR EACH ROW WHEN (NEW.version = 0)
      EXECUTE PROCEDURE update_link_changed();


DROP TABLE package_t ;

CREATE TABLE package_t (
    lesson SMALLINT NOT NULL,
    lang VARCHAR(2) NOT NULL,
    changed TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    examples CHAR(255),
    file VARCHAR(50)
);

--update word set word='test1' where link=2002 and lang='de';
--update word set word='test2' where link=2003 and lang='en';
--update word set word='test3' where link=2003 and lang='cs';

--update word set word='test53',version=10 where link=1006 and lang='cs';
--update word set word='test3' where link=1004 and lang='cs';

--insert into word (lang,word,link, version, langid) values('cs','ahoj',1005, 10, 2::"char");
--delete from word where lang='cs' and link = 1005 and version = 10;
--update link set image=1 where lid=1004;

--select *, lang_mask::bit(64) from update_package_t;

--select *, ascii(lang), ascii(lang)::bit(64), get_mask(lang), (1 | get_mask(lang))::bit(64) from t_lang;

-- 1.1.1

ALTER TABLE link DROP COLUMN del;
ALTER TABLE link ADD COLUMN del SMALLINT DEFAULT 0;