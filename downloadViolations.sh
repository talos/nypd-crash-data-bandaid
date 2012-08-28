#!/bin/bash

PATH=${PATH}:./
VIOLATIONS_PDFS=violationsPDFs.txt

# New report?
TEST_URL=$(head -n 1 ${VIOLATIONS_PDFS})
TEST_FILE="testViolations"
wget -q ${TEST_URL} -O ${TEST_FILE}.pdf
pdftotext -layout ${TEST_FILE}.pdf
./processViolations.py ${TEST_FILE}.txt > ${TEST_FILE}.csv

DIR=public/data/$(findmonthyear.py ${TEST_FILE}.txt)

rm -f ${TEST_FILE}*

if [ -e ${DIR} ]
    then
    echo Already have violations data at ${DIR}
    exit 0
fi

mkdir -p ${DIR}/raw && pushd $_

# Iterate over all violations
for URL in $(cat ${VIOLATIONS_PDFS})
do
    echo "Downloading ${URL}"
    wget -q ${URL}
done

for PDF in $(ls *.pdf)
do
    echo "Proccesing PDF ${PDF}"
    pdftotext -layout ${PDF}
done

popd

./processViolations.py ${DIR}/raw/*.txt > ${DIR}/processed.csv
