DROP TABLE IF EXISTS pinguin.place_info_type_t;
DROP TABLE IF EXISTS pinguin.place_info_t;

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
)