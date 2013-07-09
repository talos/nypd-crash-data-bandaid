#!/usr/bin/env python

import os
import sys

from zipfile import ZipFile, ZIP_DEFLATED

# Generate summary file for all accidents

TMP_PATH = './tmp'
try:
    os.mkdir(TMP_PATH)
except OSError:
    pass
ALL_ACCIDENTS_NAME = 'all_accidents.csv'
PATH_TO_DATA = './public/data'
PATH_TO_ALL_ACCIDENTS = os.path.join(PATH_TO_DATA, ALL_ACCIDENTS_NAME + '.zip')
PATH_TO_TMP_FILE = os.path.join(TMP_PATH, ALL_ACCIDENTS_NAME)

def run():
    with open(PATH_TO_TMP_FILE, 'w') as tmp_accidents_file:
        needs_header = True
        # Traverse the accidents data and re-process all text output.
        for el in os.walk(PATH_TO_DATA):
            path, dirs, files = el
            if path.endswith('accidents'):
                for filename in files:
                    if filename.endswith('.csv'):
                        path_to_file = os.path.join(path, filename)
                        with open(path_to_file) as source_file:
                            if needs_header:
                                needs_header = False # Keep header row, set flag
                            else:
                                source_file.next() # Skip header row

                            for line in source_file:
                                tmp_accidents_file.write(line)
                            sys.stdout.write(u"Adding {0} to {1}\n".format(path_to_file, PATH_TO_TMP_FILE))


    accident_archive = ZipFile(PATH_TO_ALL_ACCIDENTS, 'w', ZIP_DEFLATED)
    accident_archive.write(PATH_TO_TMP_FILE, ALL_ACCIDENTS_NAME)
    sys.stdout.write(u"Compressed {0} into {1}\n".format(PATH_TO_TMP_FILE,
                                                         PATH_TO_ALL_ACCIDENTS))
    accident_archive.close()

    os.remove(PATH_TO_TMP_FILE)

if __name__ == '__main__':
    run()
