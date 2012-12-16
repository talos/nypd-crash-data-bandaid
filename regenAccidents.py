#!/usr/bin/env python

# Regenerate all CSVs from raw data stored in public/data for every year.

import os
import sys

from processAccidents import process_accidents

PATH_TO_DATA = './public/data'

def determine_boro_from_filename(filename):
    filename = filename.lower()
    if filename.startswith('mn'):
        return (1, 'manhattan')
    elif filename.startswith('bx'):
        return (2, 'bronx')
    elif filename.startswith('bk'):
        return (3, 'brooklyn')
    elif filename.startswith('qn'):
        return (4, 'queens')
    elif filename.startswith('si'):
        return (5, 'staten_island')
    else:
        raise ValueError(u"Could not determine borough from filename {0}".format(
            filename))

# Traverse the accidents data and re-process all text output.
for el in os.walk(PATH_TO_DATA):
    path, dirs, files = el
    if path.endswith(os.path.join('accidents', 'raw')):
        for filename in files:
            if filename.endswith('.txt'):
                try:
                    boro_num, boro_name = determine_boro_from_filename(filename)
                except ValueError as e:
                    sys.stderr.write(u"%s\n".format(e))
                    continue
                path_to_file = os.path.join(path, filename)
                sys.stderr.write(u"Processing {0}\n".format(path_to_file))
                sys.stdout = open(os.path.join(path, '..', '{0}.csv'.format(boro_name)), 'w')
                process_accidents(boro_num, path_to_file)

