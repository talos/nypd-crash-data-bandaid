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


### IMPORTS ###

import re
import sys
import time

try:
    from geopy import geocoders
    GEOCODER = geocoders.Google()
except ImportError:
    sys.stderr.write(u"No geocoder available\n")
    GEOCODER = None


### CONSTANTS ###

INTERSECTIONS_LONLAT_PATH = 'public/intersections.txt'

EOP = "\x0c"

CATEGORIES = 'categories'
VEHICLES = 'vehicles'

LON = 'lon'
LAT = 'lat'
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
LON = 'lon'
LAT = 'lat'
BORO_NUM_TO_NAME = {
    '1': 'Manhattan',
    '2': 'Bronx',
    '3': 'Brooklyn',
    '4': 'Queens',
    '5': 'Staten Island'
}

HEADERS = [ YEAR, MONTH, PRECINCT, STREET_NAME, LON, LAT,
            ACCIDENTS_WITH_INJURIES, ACCIDENTS, INVOLVED,
            CATEGORY, INJURED, KILLED, VEHICLE_TYPE, VEHICLE_COUNT,
            LON, LAT ]


### FUNCTIONS ###

def read_intersections_lonlat_dict(path_to_file):
    """
    Generate a dict of all intersections for quick matching to lon/lat.
    """
    result = {}
    # '0' is for invalid/unidentified boros
    for b in range(0, 6):
        result[str(b)] = {}
    with open(INTERSECTIONS_LONLAT_PATH) as f:
        for line in f:
            line = line.strip('\n\r')
            boro, street1, street2, lon, lat  = line.split('\t')
            street1 = street1.lower()
            street2 = street2.lower()
            boro_result = result[boro]
            if lon and lat:
                lon_lat = ('{0:.6f}'.format(float(lon)), '{0:.6f}'.format(float(lat)))
            else:
                lon_lat = None
            street1_dict = boro_result.get(street1)
            street2_dict = boro_result.get(street2)
            if street1_dict:
                street1_dict.update({
                    street2: lon_lat
                })
            else:
                boro_result[street1] = {
                    street2: lon_lat
                }

            if street2_dict:
                street2_dict.update({
                    street1: lon_lat
                })
            else:
                boro_result[street2] = {
                    street1: lon_lat
                }

    return result

def write_intersections_lonlat_dict(path_to_file, boro_num, street1, street2, lon, lat):
    with open(INTERSECTIONS_LONLAT_PATH, 'a') as f:
        f.write(u"\t".join([str(boro_num), street1, street2,
                            str(lon), str(lat)]) + '\n')

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

def geocode_intersection(street1, street2, boro_num):
    """
    Make external call to Google to get intersection, if possible.
    """
    try:
        # kwarg `exactly_one=False` will return a list of possibilities, but
        # experience shows that these options are all bad.
        resp = GEOCODER.geocode(u"{0} and {1}, {2}, NY".format(street1,
                                                               street2,
                                                               BORO_NUM_TO_NAME[str(boro_num)]))
        time.sleep(2)
        latlon = resp[1]
        lonlat = (str(latlon[1]), str(latlon[0]))
        write_intersections_lonlat_dict(INTERSECTIONS_LONLAT_PATH, boro_num,
                                        street1, street2, str(latlon[1]),
                                        str(latlon[0]))
        return lonlat
    except ValueError as e:
        write_intersections_lonlat_dict(INTERSECTIONS_LONLAT_PATH, boro_num,
                                        street1, street2, '', '')
        sys.stderr.write(u"{0} for {1} and {2}\n".format(e, street1, street2))

def parse_lines(lines, boro_num, intersections_lonlat_dict):

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
    boro_intersections_dict = intersections_lonlat_dict[str(boro_num)]

    lonlat_nomatch = 0
    lonlat_match = 0

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
        #contributing = line[110:].strip() # this does nothing

        if category == 'Total':
            #we are done this intersection
            street_name = street_name.strip()
            intersection[STREET_NAME] = street_name

            street1, street2 = street_name.lower().split(' and ')

            lonlat = None
            unknown_lonlat = False
            street1_dict = boro_intersections_dict.get(street1)
            if street1_dict is not None:
                lonlat = street1_dict.get(street2.lower())
                if lonlat is None and street2.lower() in street1_dict:
                    unknown_lonlat = True

            if lonlat is None and GEOCODER is not None and unknown_lonlat == False:
                lonlat = geocode_intersection(street1, street2, boro_num)

            if lonlat is None:
                # Default to empty lonlat
                lonlat = ('', '')

                lonlat_nomatch += 1
                sys.stderr.write(u"Could not identify lonlat for {0}\n".format(street_name))

            if lonlat:
                lonlat_match += 1

            intersection[LON], intersection[LAT] = lonlat

            street_name = ''
            intersections.append(intersection)
            intersection = make_intersection(precinct, month_year[0], month_year[1])

    if lonlat_nomatch > 0:
        sys.stderr.write(u"Found lonlat matches for {0} intersections, could not for {1} intersections ({2}%)\n".format(
            lonlat_match, lonlat_nomatch, 100.0 * lonlat_match / (lonlat_match + lonlat_nomatch)))

    return intersections

def process_accidents(boro_num, filename):
    """
    Meat of the script -- process accidents for a borough from a text-ified
    PDF.
    """

    intersections_lonlat_dict = read_intersections_lonlat_dict(INTERSECTIONS_LONLAT_PATH)
    f = open(filename)

    lines = f.readlines()
    intersections = parse_lines(lines, boro_num, intersections_lonlat_dict)

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

                intersection.pop(CATEGORY)  #todo this is ugly
                intersection.pop(INJURED)
                intersection.pop(KILLED)

### SCRIPT ###
if __name__ == '__main__':
    if len(sys.argv) != 3:
        sys.stderr.write("""
    usage: processAccidents.py <boro_num> <file>
    """)
        sys.exit(1)

    boro_num = sys.argv[1]
    filename = sys.argv[2]

    process_accidents(boro_num, filename)
