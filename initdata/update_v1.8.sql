CREATE OR REPLACE FUNCTION pinguin.place_size(entry_id INT, entry_lang_learn CHAR(2), entry_lang_native CHAR(2)) RETURNS SMALLINT AS $$
DECLARE
    size SMALLINT := 1;
BEGIN
    size := size + (SELECT COALESCE((SELECT 1 FROM pinguin.place_t pt
            JOIN translates.translate_t tt ON pt.info=tt.link
            WHERE tt.lang = entry_lang_learn AND pt.id = entry_id),0));
    --size := h1 + 1;

    size := size + (SELECT COALESCE((SELECT 1 FROM pinguin.place_t pt
                JOIN pinguin.question_t qt ON pt.id=qt.place_id
                JOIN translates.translate_t tt ON tt.link=qt.answers AND tt.lang=entry_lang_learn
                JOIN translates.translate_t tt2 ON tt2.link=qt.question AND tt2.lang=entry_lang_native
                WHERE pt.id = entry_id),0));

    RETURN size;
END; $$
LANGUAGE plpgsql;


ALTER FUNCTION pinguin.place_size(entry_id INT, entry_lang_learn CHAR(2), entry_lang_native CHAR(2)) OWNER TO uservoc4u;

SELECT pinguin.place_size(2,'cz','en');
SELECT pinguin.place_size(4,'cz','en');