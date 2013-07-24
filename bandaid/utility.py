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

import re

MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug',
          'sep', 'oct', 'nov', 'dec']


class ParserException(Exception):
    """
    Special Exception class for when the parser breaks.
    """

    def __init__(self, msg, filename, rownum, row, **kwargs):
        super(ParserException, self).__init__(msg, **kwargs)
        self.filename = filename
        self.rownum = rownum
        self.row = row

    def __repr__(self, *args, **kwargs):
        orig_repr = super(ParserException, self).__repr__(*args, **kwargs)
        return u"{0}:{1}\n\t{2}\n\t{3}".format(self.filename, self.rownum, orig_repr, self.row)

    def __str__(self):
        return str(repr(self))

    def __unicode__(self):
        return repr(self)


def columnize(input):
    """
    Turn an input string into a underscored, limited whitespace string.
    """
    return re.sub(r'\W+', u'_', input.lower()).strip('_')

def month2num(month):
    """
    Convert month like January, February, to 1 or 2, etc.
    """
    for i, m in enumerate(MONTHS):
        if month.lower().find(m) != -1:
            return i + 1

    return None
