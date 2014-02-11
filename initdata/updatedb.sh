#!/bin/sh

<<<<<<< HEAD

scp 52d58e765973ca465d000199@voc4u-miuan.rhcloud.com:~/app-root/data/dump_img.tar.gz .
=======
#scp 52d58e765973ca465d000199@voc4u-miuan.rhcloud.com:~/app-root/data/dump_img.tar.gz .
>>>>>>> f4af1c9d656e5dc3ada2f49424a4fbfa034178d0
mkdir /tmp/ahoj/
tar -xvzf dump_img.tar.gz -C /tmp/ahoj/
mkdir /tmp/ahoj/orig/
mkdir /tmp/ahoj/thumb/
mv /tmp/ahoj/assets/img/orig/* /tmp/ahoj/orig/
mv /tmp/ahoj/assets/img/thumb/* /tmp/ahoj/thumb/
echo "test"
<<<<<<< HEAD
psql voc4u -U uservoc4u -c 'delete from word;delete from package_t;delete from image;delete from lang_t;delete from link;delete from question_t; delete from question_status_t;delete from last_visit_t; delete from usr;delete from update_package_t ;delete from scores_t;'

=======
psql voc4u -U uservoc4u -c 'delete from deleted_t; delete from word;delete from package_t;delete from image;delete from lang_t;delete from link;delete from question_t; delete from question_status_t;delete from last_visit_t; delete from usr;delete from update_package_t ;'
>>>>>>> f4af1c9d656e5dc3ada2f49424a4fbfa034178d0
psql voc4u -U uservoc4u < /tmp/ahoj/dump-voc4u.sql
