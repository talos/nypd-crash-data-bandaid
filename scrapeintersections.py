#!/usr/bin/python

# By David Turner
# Copyright 2011, OpenPlans

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

#To use this, first run pdftotext -layout on the pdf, then run this
#on the resulting text file


import re
import sys
from geopy import geocoders
import time

EOP = "\x0c"

def make_intersection(precinct):
    intersection = {}
    intersection['category'] = []
    intersection['veh_types'] = []
    intersection['precinct'] = precinct
    return intersection

header_frags = [ "NYPD Precincts Map",
                 "Intersection Address",
                 "The persons involved reflects",
                 "includes the owner of a parked",
                 "Contributing factors are listed",
                 "All figures are preliminary",
                 "of intersections of any precinct",
                 "Police Department",
                 "City of New York",
                 "Motor Vehicle Accident Report",
                 "Number",
                 "Persons",
                 "Injuries",
                 ]
                 

def parse_lines(lines):
    
    #next, we have a group of lines which we will need to break up by column
    #a column looks like 
    #0         1         2         3         4         5         6         7         8        9          0         1         2         3
    #01234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789
    #bit of street name       accidents  involved   injurys category        injured kilt  veh types               contributing
    #  3 AVENUE                 5          10          1      Motorists       1       0     Large com veh(6 or      Driver inattention/distraction 4
    #  EAST 135 STREET                                        Cyclists        0       0     Passenger vehicle 8
    #a group ends when the category is "total"

    street_name = ""
    veh_types = ""
    intersections = []
    intersection = None
    for line in lines:

        #we might at any time hit a header line of some sort. 
        if len(line) < 50:
            #probably a new precinct or a blank separator or other cruft
            if "Precinct" in line:
                precinct = line.strip()
                if intersection is None:
                    intersection = make_intersection(precinct)
            continue

        #could be useful data, or could be headers
        good = True
        for header in header_frags:
            if header in line:
                good = False
                break
        if not good: 
            continue
        if not line.strip():
            continue

        street_name += line[:26].strip() + " "
        accidents = line[26:36].strip()
        if accidents:
            intersection['accidents'] = accidents
        involved = line[36:46].strip()
        if accidents:
            intersection['involved'] = involved
        with_injuries = line[46:56].strip()
        if accidents:
            intersection['accidents_with_injuries'] = with_injuries
        category = line[56:71].strip()
        injured = line[71:81].strip()
        killed  = line[81:87].strip()
        if category:
            intersection['category'].append(category)
            intersection['category'].append(injured)
            intersection['category'].append(killed)

        veh_types += line[87:105].strip() + " "
        n_veh_types = line[105:110].strip()
        if n_veh_types:
            intersection['veh_types'].append(veh_types.strip())
            intersection['veh_types'].append(n_veh_types.strip())
            veh_types = ''
        contributing = line[110:].strip()

        if category == 'Total':
            #we are done this intersection
            intersection['street_name'] = street_name.strip()
            street_name = ''
            intersections.append(intersection)
            intersection = make_intersection(precinct)

    return intersections


if not len(sys.argv) == 3:
    print "usage: scrapeintersections.py mnacc.txt manhattan"
    sys.exit(1)
filename = sys.argv[1]
boro = sys.argv[2]

geocoder = geocoders.Google()
f = open(filename)

lines = f.readlines()
intersections = parse_lines(lines)
for intersection in intersections:
    #Uncomment this for geocoding, but it doesn't really work -- someone please hack it to support
    #disambiguation.
    #place, (lat, lng) = geocoder.geocode("%s, %s, New York" % (intersection['street_name'], boro))
    #print "%s, %s," % (lat, lng),
    #time.sleep(2)
    for k in sorted(intersection.keys()):
        data = intersection[k]
        if isinstance(data, list):
            data = ",".join(data)
        print "%s, %s," % (k, data),
    print
