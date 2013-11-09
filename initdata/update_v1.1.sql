DROP TRIGGER update_package_link ON link;
DROP TRIGGER update_package_word ON word;

ALTER TABLE word DROP COLUMN langid;

ALTER TABLE word ADD COLUMN langid CHAR DEFAULT NULL;




DROP TABLE t_lang;

CREATE TABLE t_lang (
  lang CHAR UNIQUE NOT NULL,
  code VARCHAR(2) NOT NULL
);

INSERT INTO t_lang (lang,code) VALUES
(1::"char", 'ar'),
(2::"char", 'de'),
(3::"char", 'cs'),
(4::"char", 'en');

UPDATE word SET langid=(SELECT lang FROM t_lang WHERE code = 'de') WHERE lang = 'de';
UPDATE word SET langid=(SELECT lang FROM t_lang WHERE code = 'cs') WHERE lang = 'cs';
UPDATE word SET langid=(SELECT lang FROM t_lang WHERE code = 'en') WHERE lang = 'en';


DROP TABLE update_package;

CREATE TABLE update_package (
   updated TIMESTAMP DEFAULT now(),
   link INT,
   lang_mask BIGINT
);


CREATE OR REPLACE FUNCTION get_mask(mask CHAR) RETURNS BIGINT AS $$
DECLARE
result BIGINT;
BEGIN
      result := (1 << ascii(mask));

      RETURN result;
END; $$
LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_link_changed() RETURNS TRIGGER AS $$
DECLARE
    lid INT;
    -- mask full house ;-)
    mask BIGINT := -1;
BEGIN
    IF TG_TABLE_NAME = 'word' THEN
        lid := NEW.link;
    ELSE
        lid := NEW.lid;
    END IF;
    IF TG_TABLE_NAME = 'word' THEN
        mask := get_mask(NEW.lang);
    END IF;

    UPDATE update_package SET lang_mask=lang_mask | mask WHERE link=lid;
    IF NOT FOUND THEN
        INSERT INTO update_package (updated, link, lang_mask)
            VALUES (now(), lid, mask );
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


update word set word='test1' where link=1002 and lang='cs';
update word set word='test2' where link=1003 and lang='en';
update word set word='test3' where link=1003 and lang='cs';

update word set word='test53',version=10 where link=1006 and lang='cs';
update word set word='test3' where link=1004 and lang='cs';

insert into word (lang,word,link, version, langid) values('cs','ahoj',1005, 10, 2::"char");
delete from word where lang='cs' and link = 1005 and version = 10;
update link set image=1 where lid=1004;

select *, lang_mask::bit(64) from update_package;