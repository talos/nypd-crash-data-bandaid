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

# This updates the RSS feed.

import os
import stat
import sys
from datetime import datetime
import PyRSS2Gen
from ConfigParser import SafeConfigParser

PARSER = SafeConfigParser()

if not len(PARSER.read('config.ini')):
    print """No config.ini file.  You must specify a config with the root URL
for the feed.  See sample-config.ini ."""
    sys.exit(1)

URL = PARSER.get('settings', 'url')
DATA_PATH = os.sep.join(['public', 'data'])

rss = PyRSS2Gen.RSS2(
    title = "NYPD Crash Data Bandaid",
    link = URL,
    description = "A CSV band-aid for the NYPD's crash data PDFs",

    lastBuildDate = datetime.now(),

    items = [
       PyRSS2Gen.RSSItem(
         title = "NYPD Traffic CSVs for %s" % data_dir,
         link = URL + '/%s' % data_dir,
         description = "The NYPD released new traffic crash data for the month.",
         guid = PyRSS2Gen.Guid( URL + '/%s' % data_dir),
         pubDate = datetime.fromtimestamp(os.stat(DATA_PATH + os.sep + data_dir)[stat.ST_CTIME])
         )

       for data_dir in os.listdir( DATA_PATH )]
    )

rss.write_xml(open(os.sep.join([DATA_PATH, "feed.xml"]), "w"))
