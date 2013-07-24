#!/bin/bash

PUBLIC="public"
DATA="${PUBLIC}/data"
TMP="tmp"

TMP_COLLISIONS="${TMP}/collisions.csv"
TMP_SUMMONS="${TMP}/summons.csv"

COLLISIONS_CSV="${PUBLIC}/collisions.csv"
SUMMONS_CSV="${PUBLIC}/summons.csv"

COLLISIONS_ARCHIVE="${DATA}/collisions.csv.gz"
SUMMONS_ARCHIVE="${DATA}/summons.csv.gz"

START_YEAR=2011
START_MONTH=8

mkdir -p ${PUBLIC}
mkdir -p ${DATA}
mkdir -p ${TMP}

echo "Downloading data..."
./bandaid/download.py ${DATA} ${START_YEAR} ${START_MONTH}

echo "Processing collisions..."
./bandaid/processCollisions.py ${DATA}/*/*/*acc.xlsx > ${TMP_COLLISIONS}
mv ${TMP_COLLISIONS} ${COLLISIONS_CSV}

echo "Processing summons..."
./bandaid/processSummons.py ${DATA}/*/*/*sum.xlsx > ${TMP_SUMMONS}
mv ${TMP_SUMMONS} ${SUMMONS_CSV}

echo "Zipping files for downloads folder..."
gzip -c -9 ${COLLISIONS_CSV} > ${COLLISIONS_ARCHIVE}
gzip -c -9 ${SUMMONS_CSV} > ${SUMMONS_ARCHIVE}

echo "Committing changes to git..."
git add ${COLLISIONS_CSV} ${SUMMONS_CSV} ${PUBLIC}/intersections.txt
git commit -m "$(date): Auto-updating data"

echo "Publishing changes..."
./bandaid/rss.py
