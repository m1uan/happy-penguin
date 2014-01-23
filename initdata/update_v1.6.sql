drop table scores_t;
CREATE TABLE scores_t (
    lesson INTEGER NOT NULL,
    game INTEGER NOT NULL,
    lang CHAR(2) NOT NULL,
    scores_json TEXT NOT NULL,
    changed TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    debug INTEGER DEFAULT 0,
    PRIMARY KEY(lesson,game,lang,debug)
);

insert into scores_t (lesson, game, lang,scores_json) VALUES
    (-1, -1,'00' , '[ { "name":"Milan Medlik", "score":3500, "time":68 }, { "name":"Milan Medlik", "score":3400, "time":67 }, { "name":"Milan Medlik", "score":3300, "time":66 }, { "name":"Milan Medlik", "score":3200, "time":65 }, { "name":"Milan Medlik", "score":3100, "time":64 }, { "name":"Milan Medlik", "score":3000, "time":63 }, { "name":"Milan Medlik", "score":2900, "time":62 }, { "name":"Milan Medlik", "score":2800, "time":61 }, { "name":"Milan Medlik", "score":2700, "time":60 }, { "name":"Milan Medlik", "score":2600, "time":59 }, { "name":"Milan Medlik", "score":2500, "time":58 }, { "name":"Milan Medlik", "score":2400, "time":57 }, { "name":"Milan Medlik", "score":2300, "time":56 }, { "name":"Milan Medlik", "score":2200, "time":55 }, { "name":"Milan Medlik", "score":2100, "time":54 }, { "name":"Milan Medlik", "score":2000, "time":53 }, { "name":"Milan Medlik", "score":1900, "time":52 }, { "name":"Milan Medlik", "score":1800, "time":51 }, { "name":"Milan Medlik", "score":1700, "time":50 }, { "name":"Milan Medlik", "score":1600, "time":49 }, { "name":"Milan Medlik", "score":1500, "time":48 }, { "name":"Milan Medlik", "score":1400, "time":47 }, { "name":"Milan Medlik", "score":1300, "time":46 }, { "name":"Milan Medlik", "score":1200, "time":45 }, { "name":"Milan Medlik", "score":1100, "time":44 }, { "name":"Milan Medlik", "score":1000, "time":43 }, { "name":"Milan Medlik", "score":900, "time":42 }, { "name":"Milan Medlik", "score":800, "time":41 }, { "name":"Milan Medlik", "score":700, "time":40 }, { "name":"Milan Medlik", "score":600, "time":39 }, { "name":"Milan Medlik", "score":500, "time":38 }, { "name":"Milan Medlik", "score":400, "time":37 }, { "name":"Milan Medlik", "score":300, "time":36 }, { "name":"Milan Medlik", "score":200, "time":35 }, { "name":"Milan Medlik", "score":100, "time":34 } ]');