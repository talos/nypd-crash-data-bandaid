#!/usr/bin/env python
# -*- coding: utf-8 -*-

import sys
import re

# Split by extended whitespace.
SPLITTER = re.compile(r'\s{2,}')

if len(sys.argv) < 2:
    sys.stderr.write("Please specify moving violations text files to process.  They\n")
    sys.stderr.write("should have been run through pdftotext.\n")
    sys.exit(1)

# Read in each arg as a file name
for path in sys.argv[1:]:

    # open each file
    with open(path) as f:

        # process according to line
        for i, raw_line in enumerate(f):
            line = raw_line.strip()

            # "* All figures are..."
            if line.startswith('*'):
                break

            # obtain location
            elif i == 2:
                location = line

            # obtain month
            elif i == 3:
                month = line

            # obtain year
            elif i == 5:
                year = line[-4:]

            elif i > 5:
                offense, mtd, ytd = SPLITTER.split(line)

                try:
                    # Try to write to stdout -- did we capture everything?
                    sys.stdout.write(','.join([year, month, location, offense, ytd, mtd]))
                    sys.stdout.write('\n')
                except Exception as e:
                    sys.stderr.write("Unable to process '%s', aborting...\n" % path)
                    raise e
