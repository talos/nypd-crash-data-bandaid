#!/bin/sh

PATH=${PATH}:./

# Test the waters.
wget http://www.nyc.gov/html/nypd/downloads/pdf/traffic_data/bxacc.pdf
pdftotext -layout bxacc.pdf
DIR=public/data/$(findmonthyear.py bxacc.txt)/accidents

if [ -e ${DIR} ]
    then
    echo Already have accident data at ${DIR}
    rm bxacc*
    exit 0
fi

echo Grabbing data for ${DIR}

# We don't have the data yet, grab the rest
wget http://www.nyc.gov/html/nypd/downloads/pdf/traffic_data/cityacc.pdf

wget http://www.nyc.gov/html/nypd/downloads/pdf/traffic_data/bkacc.pdf
wget http://www.nyc.gov/html/nypd/downloads/pdf/traffic_data/mnacc.pdf
wget http://www.nyc.gov/html/nypd/downloads/pdf/traffic_data/qnacc.pdf
wget http://www.nyc.gov/html/nypd/downloads/pdf/traffic_data/siacc.pdf

pdftotext -layout bkacc.pdf
pdftotext -layout mnacc.pdf
pdftotext -layout qnacc.pdf
pdftotext -layout siacc.pdf

python processAccidents.py bxacc.txt > bronx.csv
python processAccidents.py bkacc.txt > brooklyn.csv
python processAccidents.py mnacc.txt > manhattan.csv
python processAccidents.py qnacc.txt > queens.csv
python processAccidents.py siacc.txt > staten_island.csv

# Everything in its proper place
mkdir -p ${DIR}/raw

mv *.csv ${DIR}
mv *acc.txt ${DIR}/raw
mv *acc.pdf ${DIR}/raw

echo Finished grabbing data for ${DIR}
