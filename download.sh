#!/bin/sh

# Test the waters.
wget http://www.nyc.gov/html/nypd/downloads/pdf/traffic_data/bxacc.pdf
pdftotext -layout bxacc.pdf
YEAR_MONTH=$(python findmonthyear.py bxacc.txt)

if [ -e ${YEAR_MONTH} ]
    then
    echo Already have data for ${YEAR_MONTH}
    rm bxacc*
    exit 0
fi

echo Grabbing data for ${YEAR_MONTH}

# We don't have the data yet, grab the rest
wget http://www.nyc.gov/html/nypd/downloads/pdf/traffic_data/bkacc.pdf
wget http://www.nyc.gov/html/nypd/downloads/pdf/traffic_data/mnacc.pdf
wget http://www.nyc.gov/html/nypd/downloads/pdf/traffic_data/qnacc.pdf
wget http://www.nyc.gov/html/nypd/downloads/pdf/traffic_data/siacc.pdf

pdftotext -layout bkacc.pdf
pdftotext -layout mnacc.pdf
pdftotext -layout qnacc.pdf
pdftotext -layout siacc.pdf

python scrapeintersections.py bxacc.txt > bronx.csv
python scrapeintersections.py bkacc.txt > brooklyn.csv
python scrapeintersections.py mnacc.txt > manhattan.csv
python scrapeintersections.py qnacc.txt > queens.csv
python scrapeintersections.py siacc.txt > staten_island.csv

# Everything in its proper place
mkdir ${YEAR_MONTH}
mkdir ${YEAR_MONTH}/raw

mv *.csv ${YEAR_MONTH}
mv *.txt ${YEAR_MONTH}/raw
mv *.pdf ${YEAR_MONTH}/raw
