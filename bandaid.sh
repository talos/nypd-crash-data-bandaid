#!/bin/bash

PUBLIC="public"
DATA="${PUBLIC}/data"

COLLISIONS_CSV="${PUBLIC}/collisions.txt"
SUMMONS_CSV="${PUBLIC}/summons.txt"

COLLISIONS_ARCHIVE="${DATA}/collisions.txt.gz"
SUMMONS_ARCHIVE="${DATA}/summons.txt.gz"

./bandaid/download.py ${RAW_DATA} 2011 8
./bandaid/processCollisions.py ${RAW_DATA}/*/*/*acc.xlsx > ${COLLISIONS_CSV}
./bandaid/processSummons.py ${RAW_DATA}/*/*/*sum.xlsx > ${SUMMONS_CSV}

gzip -c -9 ${COLLISIONS_CSV} > ${COLLISIONS_ARCHIVE}
gzip -c -9 ${SUMMONS_CSV} > ${SUMMONS_ARCHIVE}
