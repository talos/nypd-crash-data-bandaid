#!/usr/bin/env python

# By John Krauss
# Copyright 2013

#  This program is free software: you can redistribute it and/or
# modify it under the terms of the GNU General Public License
# as published by the Free Software Foundation, either version 3 of
# the License, or (at your option) any later version.

# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License for more details.

# You should have received a copy of the GNU General Public License
# along with this program.  If not, see <http://www.gnu.org/licences/>

import os
import requests
try:
    import cStringIO as StringIO
    StringIO
except ImportError:
    import StringIO
import sys
import xlrd
import zipfile

from utility import month2num

CURRENT_EXCEL_ROOT = u'http://www.nyc.gov/html/nypd/downloads/excel/traffic_data/'
CURRENT_PDF_ROOT = u'http://www.nyc.gov/html/nypd/downloads/pdf/traffic_data/'
TRAFFIC_ROOT = u'http://www.nyc.gov/html/nypd/downloads/zip/traffic_data/'
ACC_TEMPLATE = TRAFFIC_ROOT + u'{year}_{month:0>2}_acc.zip'
SUM_TEMPLATE = TRAFFIC_ROOT + u'{year}_{month:0>2}_sum.zip'


def save_archive(archive_path, zip_bytestring, year, month):
    """
    Save a raw archive from a bytestring of a zip archive.
    """
    buffer = StringIO.StringIO()
    buffer.write(zip_bytestring)
    archive = zipfile.ZipFile(buffer)
    if any([f.filename[0] in ('.', '/') for f in archive.filelist]):
        raise Exception(u"Unsafe filename in zip archive, not extracting: {0}".format(
            [f.filename for f in archive.filelist]))
    path = os.path.join(archive_path, str(year), u'{:0>2}'.format(month))
    try:
        os.makedirs(path)
    except OSError:
        pass
    archive.extractall(path)
    archive.close()
    buffer.close()
    sys.stderr.write(u"Unzipped to {0}\n".format(path))


if __name__ == '__main__':
    if len(sys.argv) != 4:
        sys.stderr.write("""
    usage: downloadCollisions.py <archive_path> <first_year> <first_month>

""")
        sys.exit(1)

    archive_path = sys.argv[1]
    year = int(sys.argv[2])
    month = int(sys.argv[3]) - 1

    # Loop through and download archives
    while True:
        if month == 12:
            month = 1
            year += 1
        else:
            month += 1

        acc_path = ACC_TEMPLATE.format(year=year, month=month)
        sum_path = SUM_TEMPLATE.format(year=year, month=month)
        codes = {}
        for path in (acc_path, sum_path):
            sys.stderr.write(u"Downloading {0}...\n".format(path))
            resp = requests.get(path)
            codes[path] = resp.status_code
            if resp.status_code == 200:
                sys.stderr.write(u"Downloaded {0} ({1} bytes), unzipping...\n".format(
                    path, len(resp.content)))
                save_archive(archive_path, resp.content, year, month)
            else:
                sys.stderr.write(u"Couldn't download {0}: {1}...\n".format(
                    path, resp.status_code))

        if all([c != 200 for c in codes.values()]):
            sys.stderr.write(u"No more archives! {codes} at {year}/{month} "
                             u"\n".format(year=year, month=month, codes=codes))
            break

    # Also download current acc reports in case NYPD forgot to add them to the
    # zip archive
    sys.stderr.write(u"Downloading current acc reports...\n")

    resp = requests.get(CURRENT_EXCEL_ROOT + u'cityacc.xlsx')

    sh = xlrd.open_workbook(file_contents=resp.content).sheet_by_index(0)
    _, cur_month_name, cur_year = sh.row(1)[0].value.split()

    month = month2num(cur_month_name)
    year = int(cur_year)

    path = os.path.join(archive_path, str(year), u'{:0>2}'.format(month))
    try:
        os.makedirs(path)
    except OSError:
        pass

    for boro in ('city', 'bk', 'bx', 'mn', 'qn', 'si'):
        pdf_resp = requests.get(u'{0}{1}{2}'.format(CURRENT_PDF_ROOT, boro, 'acc.pdf'))
        filename = pdf_resp.url.split('/')[-1]
        open(os.path.join(path, filename), 'w').write(pdf_resp.content)
        sys.stderr.write(u"Wrote {0} to {1}\n".format(filename, path))

        excel_resp = requests.get(u'{0}{1}{2}'.format(CURRENT_EXCEL_ROOT, boro, 'acc.xlsx'))
        filename = excel_resp.url.split('/')[-1]
        open(os.path.join(path, filename), 'w').write(excel_resp.content)
        sys.stderr.write(u"Wrote {0} to {1}\n".format(filename, path))
