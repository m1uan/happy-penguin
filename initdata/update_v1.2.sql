
alter table link drop column q_status;
--alter table link add column q_status SMALLINT DEFAULT 0;

drop table question_status_t;
drop table question_t;
drop sequence question_t_qid_seq;

create table question_status_t (
     link INTEGER NOT NULL,
     status SMALLINT NOT NULL,
     changed TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

create table question_t (
    qid SERIAL,
    message TEXT,
    link INTEGER NOT NULL,
    lang1 VARCHAR(2) NOT NULL,
    lang2 VARCHAR(2) NOT NULL,
    usr INTEGER NOT NULL,
    FOREIGN KEY (usr) REFERENCES usr (id) ,
    created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    changed TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY(qid)
);


DROP TRIGGER update_package_link ON link;
-- just UPDATE because every change first must change version
-- where WHERE version = 0 because there is also change to version max
-- just when is changed image, because if somebody change description
-- we dont want update for all package, because for voc4u android customer isn't any change
CREATE TRIGGER update_package_link
   AFTER UPDATE ON link
   FOR EACH ROW WHEN (NEW.version = 0 AND NEW.image != OLD.image)
   EXECUTE PROCEDURE update_link_changed();
--alter table question_t owner to uservoc4u;
--alter table question_message_t owner to uservoc4u;