drop table question_t;
drop sequence question_t_qid_seq;
drop table question_message_t;
drop sequence question_message_t_qid_seq ;

create table question_t (
    qid SERIAL,
    status SMALLINT,
    created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    changed TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    word TEXT NOT NULL,
    lang1 VARCHAR(2) NOT NULL,
    lang2 VARCHAR(2) NOT NULL,
    link INTEGER NOT NULL,
    usr INTEGER NOT NULL,
    FOREIGN KEY (usr) REFERENCES usr (id) ,
    PRIMARY KEY(qid)
) ;

create table question_message_t (
    qmid SERIAL,
    message TEXT,
    question INTEGER,
    FOREIGN KEY (question) REFERENCES question_t (qid) ,
    created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY(qmid)
);