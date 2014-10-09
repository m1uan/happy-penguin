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

ALTER TABLE pinguin.place_t ADD COLUMN place_info INTEGER;
ALTER TABLE pinguin.place_t ADD FOREIGN KEY (place_info) REFERENCES pinguin.place_info_t (pi);
ALTER TABLE pinguin.place_t ALTER COLUMN name DROP NOT NULL;

ALTER TABLE link ADD COLUMN usage INTEGER DEFAULT 0;