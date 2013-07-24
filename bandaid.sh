#!/bin/bash

PUBLIC="public"
DATA="${PUBLIC}/data"
TMP="tmp"

TMP_COLLISIONS_CSV="${TMP}/collisions.csv"
TMP_SUMMONS_CSV="${TMP}/summons.csv"
TMP_COLLISIONS_JSON="${TMP}/collisions.json"

COLLISIONS_CSV="${PUBLIC}/collisions.csv"
SUMMONS_CSV="${PUBLIC}/summons.csv"

COLLISIONS_CSV_ARCHIVE="${DATA}/collisions.csv.gz"
COLLISIONS_JSON_ARCHIVE="${DATA}/collisions.json.gz"
SUMMONS_CSV_ARCHIVE="${DATA}/summons.csv.gz"

START_YEAR=2011
START_MONTH=8

mkdir -p ${PUBLIC}
mkdir -p ${DATA}
mkdir -p ${TMP}

echo "Downloading data..."
./bandaid/download.py ${DATA} ${START_YEAR} ${START_MONTH}

echo "Processing collisions..."
./bandaid/process_collisions.py ${DATA}/*/*/*acc.xlsx > ${TMP_COLLISIONS_CSV}
mv ${TMP_COLLISIONS_CSV} ${COLLISIONS_CSV}

echo "Processing summons..."
./bandaid/process_summons.py ${DATA}/*/*/*sum.xlsx > ${TMP_SUMMONS_CSV}
mv ${TMP_SUMMONS_CSV} ${SUMMONS_CSV}

echo "Generating JSON version of collisions..."
./bandaid/convert_collisions_to_json.py ${COLLISIONS_CSV} > ${TMP_COLLISIONS_JSON}

echo "Zipping files for downloads folder..."
gzip -c -9 ${COLLISIONS_CSV} > ${COLLISIONS_CSV_ARCHIVE}
gzip -c -9 ${TMP_COLLISIONS_JSON} > ${COLLISIONS_JSON_ARCHIVE}
rm ${TMP_COLLISIONS_JSON}
gzip -c -9 ${SUMMONS_CSV} > ${SUMMONS_CSV_ARCHIVE}

echo "Committing changes to git..."
git add ${COLLISIONS_CSV} ${SUMMONS_CSV} ${PUBLIC}/intersections.txt
git commit -m "$(date): Auto-updating data"

echo "Publishing changes..."
./bandaid/rss.py
