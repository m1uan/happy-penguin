
alter table link drop column q_status;
alter table link add column q_status SMALLINT DEFAULT 0;

drop table question_t;
drop sequence question_t_qid_seq;



create table question_t (
    qid SERIAL,
    message TEXT,
    link INTEGER,
    lang1 VARCHAR(2) NOT NULL,
    lang2 VARCHAR(2) NOT NULL,
    usr INTEGER NOT NULL,
    FOREIGN KEY (usr) REFERENCES usr (id) ,
    created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    changed TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY(qid)
);

--alter table question_t owner to uservoc4u;
--alter table question_message_t owner to uservoc4u;