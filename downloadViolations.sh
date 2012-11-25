#!/bin/bash

PATH=${PATH}:./
VIOLATIONS_PDFS=violationsPDFs.txt

# New report?
TEST_URL=$(head -n 1 ${VIOLATIONS_PDFS})
TEST_FILE="testViolations"

wget ${TEST_URL} -O ${TEST_FILE}.pdf
pdftotext -layout ${TEST_FILE}.pdf

./processViolations.py ${TEST_FILE}.txt > ${TEST_FILE}.csv

DIR=public/data/$(findmonthyear.py ${TEST_FILE}.csv)/violations

rm -f ${TEST_FILE}*

if [ -e ${DIR} ]
    then
    echo Already have violations data at ${DIR}
    exit 0
fi

mkdir -p ${DIR}/raw
RAW_DIR=$_

# Iterate over all violations
for URL in $(cat ${VIOLATIONS_PDFS})
do
    pushd ${RAW_DIR}
    echo "Downloading ${URL}"
    wget -q ${URL}
    popd
done

pushd ${RAW_DIR}
for PDF in $(ls *.pdf)
do
    echo "Proccesing PDF ${PDF}"
    pdftotext -layout ${PDF}
done
popd

python processViolations.py ${DIR}/raw/*.txt > ${DIR}/processed.csv
