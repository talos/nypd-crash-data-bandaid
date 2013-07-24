#!/usr/bin/env python
# -*- coding: utf-8 -*-

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
import sys
import xlrd

from utility import ParserException, columnize, month2num


SUMMONS = [u'Backing Unsafely',
           u'Brake Lights (Defect.or  Improper)',
           u'Bus Lane, Driving in',
           u'Cell Phone',
           u'Commercial Veh on Pkwy',
           u'Defective Brakes',
           u'Disobey Sign',
           u'Equipment (Other)',
           u'Fail to Keep Right',
           u'Fail to Signal',
           u'Fail to Stop on Signal',
           u'Following Too Closely',
           u'Headlights (Defect. or Improper)',
           u'Improper Lights',
           u'Improper Passing',
           u'Improper Turn',
           u'Improper/Missing Plates',
           u'Not Giving R of W to Pedes.',
           u'Not Giving R of W to Veh.',
           u'One Way Street',
           u'Pavement Markings',
           u'Safety Belt',
           u'School Bus, Passing Stopped',
           u'Speeding',
           u'Spillback',
           u'Tinted Windows',
           u'Truck Routes',
           u'U-Turn',
           u'Uninspected',
           u'Uninsured',
           u'Unlicensed Operator',
           u'Unregistered',
           u'Unsafe Lane Change',
           u'Other Movers',
           u'TOTAL Movers']
DATA_COLUMNS = [columnize(s + u' mtd') for s in SUMMONS]
DATA_COLUMNS.extend([columnize(s + u' ytd') for s in SUMMONS])


def process_summons(filename):
    """
    Convert a single Excel file to two rows of a CSV.
    """
    sh = xlrd.open_workbook(filename).sheet_by_index(0)
    geog = sh.row(1)[0].value
    month = month2num(sh.row(2)[0].value)
    year = int(sh.row(3)[2].value[-4:])

    data = {}
    for rnum in xrange(4, 39):
        prev_row = sh.row(rnum - 1)
        row = sh.row(rnum)

        if row[0].ctype == 0:
            col_val = prev_row[0].value.split(u'\n')[-1]
        else:
            col_val = row[0].value.split(u'\n')[0]

        if row[1].ctype == 0:
            mtd_val = int(prev_row[1].value.split(u'\n')[-1])
        else:
            mtd_val = int(row[1].value) if row[1].ctype == 2 else int(row[1].value.split(u'\n')[0])

        if row[2].ctype == 0:
            ytd_val = int(prev_row[2].value.split(u'\n')[-1])
        else:
            ytd_val = int(row[2].value) if row[2].ctype == 2 else int(row[2].value.split(u'\n')[0])

        mtd_col = columnize(col_val + u' mtd')
        ytd_col = columnize(col_val + u' ytd')

        data[mtd_col] = mtd_val
        data[ytd_col] = ytd_val

    sys.stdout.write(u'\t'.join([unicode(geog), unicode(year), unicode(month)]))
    for c in DATA_COLUMNS:
        sys.stdout.write(u'\t' + unicode(data[c]))
    sys.stdout.write(u'\n')

def print_header():
    print(u'\t'.join([u'geo', u'year', u'month'] + DATA_COLUMNS))


if __name__ == '__main__':
    if len(sys.argv) < 2:
        sys.stderr.write("""
    usage: {0} <files>
    \n""".format(sys.argv[0]))
        sys.exit(1)

    print_header()
    for path in sys.argv[1:]:
        name = os.path.basename(path)
        if name.endswith('sum.xlsx'):
            sys.stderr.write(u"{0}\n".format(path))
        try:
            process_summons(path)
        except ParserException as e:
            sys.stderr.write("Parser error: {0}\n".format(e))
