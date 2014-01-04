#!/bin/sh

#scp 525d8b535973caad560002dc@voc4u-miuan.rhcloud.com:~/app-root/data/dump_img.tar.gz .
mkdir /tmp/ahoj/
tar -xvzf dump_img.tar.gz -C /tmp/ahoj/
mkdir /tmp/ahoj/orig/
mkdir /tmp/ahoj/thumb/
mv /tmp/ahoj/assets/img/orig/* /tmp/ahoj/orig/
mv /tmp/ahoj/assets/img/thumb/* /tmp/ahoj/thumb/
echo "test"
psql voc4u -U uservoc4u -c 'delete from word;delete from package_t;delete from image;delete from lang_t;delete from link;delete from question_t; delete from question_status_t;delete from last_visit_t; delete from usr;delete from update_package_t ;'
#psql voc4u -U uservoc4u < /tmp/ahoj/dump-voc4u.sql
