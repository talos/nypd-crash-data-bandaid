#!/usr/bin/env python

# Copyright (c) 2012 John Krauss

# This program is free software: you can redistribute it and/or
# modify it under the terms of the GNU General Public License
# as published by the Free Software Foundation, either version 3 of
# the License, or (at your option) any later version.

# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License for more details.

# You should have received a copy of the GNU General Public License
# along with this program.  If not, see <http://www.gnu.org/licences/>

# This quickly extracts year & month from a NYPD traffic stat PDF.
# First, run pdftotext -layout on the pdf, then run this on the
# resulting text file

import re
import sys

def month2num(month):
    return {
        'jan': '01',
        'feb': '02',
        'mar': '03',
        'apr': '04',
        'may': '05',
        'jun': '06',
        'jul': '07',
        'aug': '08',
        'sep': '09',
        'oct': '10',
        'nov': '11',
        'dec': '12'
        }[month.lower()[0:3]]

def find_month_year(lines):
    for line in lines:
        match = re.search(r'(january|february|march|april|may|june|july|august|september|december)\s+(\d+)', line, flags=re.I)
        if match:
            return match.group(1), match.group(2)

if len(sys.argv) != 2:
    print """
usage: findmonthyear.py [file]
"""
    sys.exit(1)

filename = sys.argv[1]

f = open(filename)

lines = f.readlines()
month_year = find_month_year(lines)

if not month_year:
    sys.exit("Couldn't find month and year from %s" % filename)
else:
    print '%s%s' % (month_year[1], month2num(month_year[0]))
