#!/usr/bin/env python

import os
import sys

from zipfile import ZipFile, ZIP_DEFLATED

# Generate summary file for all accidents

ALL_ACCIDENTS_NAME = 'all_accidents.csv'
PATH_TO_DATA = './public/data'
PATH_TO_ALL_ACCIDENTS = os.path.join(PATH_TO_DATA, ALL_ACCIDENTS_NAME + '.zip')
PATH_TO_TMP_FILE = './tmp/' + ALL_ACCIDENTS_NAME

with open(PATH_TO_TMP_FILE, 'w') as tmp_accidents_file:
    # Traverse the accidents data and re-process all text output.
    for el in os.walk(PATH_TO_DATA):
        path, dirs, files = el
        if path.endswith('accidents'):
            for filename in files:
                if filename.endswith('.csv'):
                    path_to_file = os.path.join(path, filename)
                    tmp_accidents_file.write(open(path_to_file).read())
                    sys.stdout.write(u"Adding {0} to {1}\n".format(path_to_file, PATH_TO_TMP_FILE))

with ZipFile(PATH_TO_ALL_ACCIDENTS, 'w', ZIP_DEFLATED) as accident_archive:
    accident_archive.write(PATH_TO_TMP_FILE, ALL_ACCIDENTS_NAME)
    sys.stdout.write(u"Compressed {0} into {1}\n".format(PATH_TO_TMP_FILE,
                                                         PATH_TO_ALL_ACCIDENTS))

os.remove(PATH_TO_TMP_FILE)
