DROP TRIGGER update_package_link ON link;
-- just UPDATE because every change first must change version
-- where WHERE version = 0 because there is also change to version max
-- just when is changed image, because if somebody change description
-- we dont want update for all package, because for voc4u android customer isn't any change
CREATE TRIGGER update_package_link
   AFTER UPDATE ON link
   FOR EACH ROW WHEN (NEW.version = 0 AND ((NEW.image != OLD.image) OR (OLD.image IS NOT NULL AND NEW.image IS NULL) OR (OLD.image IS NULL AND NEW.image IS NOT NULL)))
   EXECUTE PROCEDURE update_link_changed();
--alter table question_t owner to uservoc4u;
--alter table question_message_t owner to uservoc4u;