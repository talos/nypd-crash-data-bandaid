#!/usr/bin/env python

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

# Further modifications to enhance CSV output and multidimensionality
# by John Krauss.

#To use this, first run pdftotext -layout on the pdf, then run this
#on the resulting text file

import re
import sys

EOP = "\x0c"

CATEGORIES = 'categories'
VEHICLES = 'vehicles'

YEAR = 'year'
MONTH = 'month'
CATEGORY = 'category'
INJURED = 'injured'
KILLED = 'killed'
VEHICLE_TYPE = 'vehicle_type'
VEHICLE_COUNT = 'vehicle_count'
PRECINCT = 'precinct'
ACCIDENTS = 'accidents'
ACCIDENTS_WITH_INJURIES = 'accidents_with_injuries'
INVOLVED = 'involved'
STREET_NAME = 'street_name'

HEADERS = [ YEAR, MONTH, PRECINCT, STREET_NAME,
            ACCIDENTS_WITH_INJURIES, ACCIDENTS, INVOLVED,
            CATEGORY, INJURED, KILLED, VEHICLE_TYPE, VEHICLE_COUNT ]

def make_intersection(precinct, month, year):
    intersection = {}
    intersection[CATEGORIES] = {}
    intersection[VEHICLES] = {}
    intersection[PRECINCT] = precinct
    intersection[MONTH] = month
    intersection[YEAR] = year
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
    month_year = None # two-tuple (month, year)
    for line in lines:

        # pull out month & year if we haven't already.
        if not month_year:
            match = re.search(r'(january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d+)', line, flags=re.I)
            if match:
                month_year = (match.group(1), match.group(2))

        #we might at any time hit a header line of some sort. 
        if len(line) < 50:
            #probably a new precinct or a blank separator or other cruft
            if "Precinct" in line:
                precinct = line.strip()
                if intersection is None:
                    intersection = make_intersection(precinct, month_year[0], month_year[1])
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
            intersection[ACCIDENTS] = accidents
        involved = line[36:46].strip()
        if accidents:
            intersection[INVOLVED] = involved
        with_injuries = line[46:56].strip()
        if accidents:
            intersection[ACCIDENTS_WITH_INJURIES] = with_injuries
        category = line[56:71].strip()
        injured = line[71:81].strip()
        killed  = line[81:87].strip()
        if category:
            intersection[CATEGORIES][category] = {}
            intersection[CATEGORIES][category][INJURED] = injured
            intersection[CATEGORIES][category][KILLED] = killed

        veh_types += line[87:105].strip() + " "
        n_veh_types = line[105:110].strip()
        if n_veh_types:
            intersection[VEHICLES][veh_types.strip()] = n_veh_types.strip()
            veh_types = ''
        contributing = line[110:].strip() # this does nothing

        if category == 'Total':
            #we are done this intersection
            intersection[STREET_NAME] = street_name.strip()
            street_name = ''
            intersections.append(intersection)
            intersection = make_intersection(precinct, month_year[0], month_year[1])

    return intersections


if len(sys.argv) != 2:
    print """
usage: processAccidents.py [file]
"""
    sys.exit(1)

filename = sys.argv[1]

f = open(filename)

lines = f.readlines()
intersections = parse_lines(lines)

print ','.join(HEADERS)

for intersection in intersections:

    # watchu doin in the intersection?
    if VEHICLES in intersection:
        for vehicle_type, vehicle_count in intersection[VEHICLES].items():
            intersection[VEHICLE_TYPE] = vehicle_type
            intersection[VEHICLE_COUNT] = vehicle_count
            print ','.join([intersection.get(header, '') for header in HEADERS])
            intersection.pop(VEHICLE_TYPE)  #TODO this is ugly
            intersection.pop(VEHICLE_COUNT)


    if CATEGORIES in intersection:
        for category, category_data in intersection[CATEGORIES].items():
            intersection[CATEGORY] = category
            intersection[INJURED] = category_data[INJURED]
            intersection[KILLED] = category_data[KILLED]
            print ','.join([intersection.get(header, '') for header in HEADERS])
            intersection.pop(CATEGORY)  #TODO this is ugly
            intersection.pop(INJURED)
            intersection.pop(KILLED)
