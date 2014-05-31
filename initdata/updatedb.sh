#!/bin/sh


scp 52d58e765973ca465d000199@voc4u-miuan.rhcloud.com:~/app-root/data/dump_img.tar.gz .
mkdir /tmp/ahoj/
tar -xvzf dump_img.tar.gz -C /tmp/ahoj/
mkdir /tmp/ahoj/orig/
mkdir /tmp/ahoj/thumb/

mv /tmp/ahoj/assets/img/orig/* /tmp/ahoj/orig/
mv /tmp/ahoj/assets/img/thumb/* /tmp/ahoj/thumb/
mkdir /tmp/ahoj/assets/img/orig/place
echo "test"
psql voc4u -U uservoc4u -c 'delete from word;delete from package_t;delete from image;delete from lang_t;delete from link;delete from question_t; delete from question_status_t;delete from last_visit_t; delete from usr;delete from update_package_t ;delete from scores_t;'

psql voc4u -U uservoc4u -c 'delete from pinguin.image_t;delete from pinguin.question_t;delete from pinguin.place_t;update translates.lang_t set link=null;delete from translates.translate_t;delete from translates.link_t;delete from translates.lang_t;'

psql voc4u -U uservoc4u < /tmp/ahoj/dump-voc4u.sql
