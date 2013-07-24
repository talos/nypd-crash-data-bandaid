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
from pygeolib import GeocoderError
import re
import sys
import time
import xlrd

from utility import ParserException, month2num, columnize

try:
    import pygeocoder
    GEOCODER = pygeocoder.Geocoder
except ImportError:
    sys.stderr.write(u"No geocoder available\n")
    GEOCODER = None

INTERSECTIONS_LONLAT_PATH = 'public/intersections.txt'

VEHICLES = set([u'Ambulance',
                u'Bicycle',
                u'Bus',
                u'Fire truck',
                u'Large com veh(6 or more tires)',
                u'Livery vehicle',
                u'Motorcycle',
                u'Other',
                u'Passenger vehicle',
                u'Pedicab',
                u'Pick-up truck',
                u'Scooter',
                u'Small com veh(4\ntires)',
                u'Sport utility /\nstation wagon',
                u'Taxi vehicle',
                u'Unknown',
                u'Van'])
VEHICLE_COLUMNS = [columnize(v) for v in sorted(VEHICLES)]

CONTRIBUTING_FACTORS = set([u'Driver inexperience',
                            u'Fatigued/Drowsy',
                            u'Traffic control disregarded',
                            u'Backing unsafely',
                            u'Err/Confusn ped/Bike/Other ped',
                            u'Lost consciousness',
                            u'Other uninvolved vehicle',
                            u'Turning improperly',
                            u'Physical disability',
                            u'Prescription medication',
                            u'Listening/using headphones',
                            u'Vehicle vandalism',
                            u'Eating or drinking',
                            u'Texting',
                            u'Unsafe speed',
                            u'Outside car distraction',
                            u'Other electronic device',
                            u'Alcohol involvement',
                            u'Aggressive driving/road rage',
                            u'Fell asleep',
                            u'Cell phone (hand-held)',
                            u'Illness',
                            u'Driver inattention/distraction',
                            u'Failure to yield right-of-way',
                            u'Passenger distraction',
                            u'Passing or lane usage',
                            u'Following too closely',
                            u'Unsafe lane changing',
                            u'Failure to keep right',
                            u'Drugs (illegal)'])
CONTRIBUTING_COLUMNS = [columnize(v) for v in sorted(CONTRIBUTING_FACTORS)]

# Row types
DATA = 'data'
DATA_CONTINUATION = 'continuation'  # for when a cell crosses to the next sheet
MISSING_VEHICLE = 'missing_vehicle'  # vehicle info migrated to bottom
MISSING_CONTRIBUTING = 'missing_contributing'  # contributing factor migrated to bottom
PRECINCT = 'precinct'
PAGE_BREAK = 'page_break'
HEADER_ROW = 'header_row'
BOROUGH_YEARMONTH = 'borough_yearmonth'
EMPTY = 'empty'

# Excel Columns
INTERSECTION = 'intersection'
COLLISIONS = 'collisions'
PERSONS = 'persons'
COLLISIONS_WITH_INJURY = 'collisions_with_injury'
INJURED = 'injured'
KILLED = 'killed'
VEHICLE = 'vehicle'
CONTRIBUTING = 'contributing'
BORO_NUM_TO_NAME = {
    '1': 'Manhattan',
    '2': 'Bronx',
    '3': 'Brooklyn',
    '4': 'Queens',
    '5': 'Staten Island'
}

def read_intersections_lonlat_dict(path):
    """
    Generate a dict of all intersections for quick matching lon/lat.
    """
    result = {}
    with open(path) as f:
        for line in f:
            line = line.strip('\n\r')
            boro, precinct, street1, street2, lon, lat, in_precinct, dist_from_precinct = \
                line.split(u'\t')
            boro = int(boro)
            street1 = street1.lower()
            street2 = street2.lower()
            key1 = (boro, street1, street2)
            key2 = (boro, street2, street1)
            if not key1 in result and not key2 in result:
                result[key1] = (lon, lat)

    return result


def write_intersections_file(borocode, precinct, street1, street2, lonlat):
    with open(INTERSECTIONS_LONLAT_PATH, 'a') as f:
        f.write(u"\t".join([str(borocode), str(precinct), street1, street2,
                            str(lonlat[0]), str(lonlat[1])]) + u'\n')


def geocode_intersection(street1, street2, borocode):
    """
    Make external call to Google to get intersection, if possible.
    """
    try:
        boro_name = BORO_NUM_TO_NAME[str(borocode)]
        sys.stderr.write(u"Trying to geocode {0} and {1}, {2}\n".format(
            street1, street2, boro_name))
        # kwarg `exactly_one=False` will return a list of possibilities, but
        # experience shows that these options are all bad.
        resp = GEOCODER.geocode(u"{0} and {1}, {2}, NY".format(street1,
                                                               street2,
                                                               BORO_NUM_TO_NAME[str(borocode)]))
        time.sleep(4)
        lonlat = (str(resp.longitude), str(resp.latitude), )
        return lonlat
    except GeocoderError as e:
        sys.stderr.write(unicode(e) + u'\n')
        return None


def print_header():
    """
    Print the header row.
    """
    header_row =[u'borocode',
                 u'precinct',
                 u'year',
                 u'month',
                 u'lon',
                 u'lat',
                 u'street1',
                 u'street2',
                 u'collisions',
                 u'persons_involved',
                 u'collisions_with_injuries',
                 u'motorists_injured',
                 u'passengers_injured',
                 u'cyclists_injured',
                 u'pedestr_injured',
                 u'total_injured',
                 u'motorists_killed',
                 u'passengers_killed',
                 u'cyclists_killed',
                 u'pedestr_killed',
                 u'total_killed']
    header_row.extend(VEHICLE_COLUMNS)
    header_row.extend(CONTRIBUTING_COLUMNS)

    print(u'\t'.join(header_row))


def extract_year_month(input):
    """
    Turn something like ("January", 2011) into the tuple (2011, 1)
    """
    month = month2num(input[0].lower())
    year = int(input[1])

    if month:
        return year, month
    else:
        return None


def process_yearmonth_row(filename, rownum, row):
    """
    Extract borocode, year and month as three-tuple from the header row.
    """
    cell = row[0].value.split()
    b = cell[0].lower()
    if b == 'bronx':
        borocode = 2
        yearmonth = extract_year_month(cell[1:])
    elif b == 'brooklyn':
        borocode = 3
        yearmonth = extract_year_month(cell[1:])
    elif b == 'manhattan':
        borocode = 1
        yearmonth = extract_year_month(cell[1:])
    elif b == 'queens':
        borocode = 4
        yearmonth = extract_year_month(cell[1:])
    elif b == 'staten':
        borocode = 5
        yearmonth = extract_year_month(cell[2:])
    else:
        raise ParserException(u'Could not parse header row', filename, rownum, row)

    if not yearmonth:
        raise ParserException(u"Could not parse month", filename, rownum, row)

    return borocode, yearmonth[0], yearmonth[1]


def determine_column_names(filename, rownum, row):
    """
    Returns a mapping of column numbers to names.
    """
    mapping = {}
    for i, cell in enumerate(row):
        v = cell.value.lower()
        if v.startswith('intersection'):
            mapping[INTERSECTION] = i
        elif v.startswith('number of '):
            mapping[COLLISIONS] = i
        elif v.startswith('persons'):
            mapping[PERSONS] = i
        elif v.startswith('collisions with') or v.startswith('accidents with'):
            mapping[COLLISIONS_WITH_INJURY] = i
        elif v.startswith('injured'):
            mapping[INJURED] = i
        elif v.startswith('killed'):
            mapping[KILLED] = i
        elif v.startswith('vehicle'):
            mapping[VEHICLE] = i
        elif v.startswith('contributing'):
            mapping[CONTRIBUTING] = i

    if len(mapping) == 8:
        return mapping

    raise ParserException(u"Could not identify all columns", filename, rownum, row)


def row_type(filename, rownum, row, mapping):
    """
    Returns the type of this row.
    """
    if row[0].value.lower().find('precinct') != -1:
        return PRECINCT
    elif row[0].value.lower().startswith('intersection'):
        return HEADER_ROW
    # This appears in header of every page.
    elif row[0].value.lower().find('motor vehicle accident report intersections') != -1:
        return PAGE_BREAK
    elif re.match(r'^(bronx|brooklyn|manhattan|queens|staten).*2\d{3}$', row[0].value.lower().strip()):
        return BOROUGH_YEARMONTH
    # Main data rows are numbers: primary data
    elif all([r.ctype == 2 for r in (row[mapping[COLLISIONS]],
                                     row[mapping[PERSONS]],
                                     row[mapping[COLLISIONS_WITH_INJURY]])]):
        return DATA
    # Some later cell is populated: continuation
    elif any([r.ctype == 1 for r in row[1:mapping[CONTRIBUTING]]]):
        return DATA_CONTINUATION
    # All cells are empty except first: extra vehicle record
    elif row[0].ctype == 1 and all([r.ctype == 0 for r in row[1:mapping[CONTRIBUTING]]]):
        if row[0].value in VEHICLES:
            return MISSING_VEHICLE
        elif row[0].value in CONTRIBUTING:
            return MISSING_CONTRIBUTING
    # Empty rows can happen
    elif all([r.ctype == 0 for r in row[0:mapping[CONTRIBUTING]]]):
        return EMPTY
    else:
        raise ParserException(u"Could not identify type of row", filename, rownum, row)


def is_data_row_missing(filename, rownum, row, mapping):
    """
    Determine whether a data row is missing any data.
    """
    missing = set([])
    if row[mapping[VEHICLE]].ctype == 0:
        missing.add(VEHICLE)
    if row[mapping[CONTRIBUTING]].ctype == 0:
        missing.add(CONTRIBUTING)
    return missing


def identify_precinct(filename, rownum, row):
    """
    Identify precinct (as a number) from a precinct row.
    """
    matches = re.findall(r'\d+', row[0].value)
    if matches:
        return int(matches[0])
    elif row[0].value.lower().find('south') != -1:
        return 14
    elif row[0].value.lower().find('north') != -1:
        return 18
    elif row[0].value.lower().find('central') != -1:
        return 22
    else:
        raise ParserException(u"Could not identify precinct from", filename, rownum, row)


def process_accidents(filename, intersections_lonlat_dict):
    """
    Convert a single Excel file to a more generous CSV format.
    """
    sh = xlrd.open_workbook(filename).sheet_by_index(0)
    borocode, year, month = process_yearmonth_row(filename, 1, sh.row(1))
    mapping = determine_column_names(filename, 2, sh.row(2))
    filtered_rows = []
    data_missing_vehicles = []
    data_missing_contributing = []
    missing_vehicles = []
    missing_contributing = []
    for rnum in xrange(3, sh.nrows):
        row = sh.row(rnum)
        rowtype = row_type(filename, rnum, row, mapping)
        #print u"{0}\t{1}".format(rowtype, u'\t'.join([unicode(r.value).replace('\n', ' ') for r in row[0:5]]))

        # Precincts aren't stored in data rows, so they must be remembered.
        if rowtype == PRECINCT:
            precinct = identify_precinct(filename, rnum, row)

        # Create new row for data, including data missing a vehicle
        elif rowtype == DATA:
            newrow = [borocode, precinct, year, month]
            newrow.extend(row)
            filtered_rows.append(newrow)

            # Keep special track of data missing vehicles
            # These will be dealt with when we get to a pagebreak.
            missing_types = is_data_row_missing(filename, rnum, row, mapping)
            if VEHICLE in missing_types:
                data_missing_vehicles.append(newrow)
            if CONTRIBUTING in missing_types:
                data_missing_contributing.append(newrow)

        # This is a continuation of data left on a previous page -- run through
        # the columns and add the data.
        elif rowtype == DATA_CONTINUATION:
            newrow = filtered_rows[-1]
            for i, col in enumerate(row):
                if newrow[i + 4].ctype == 2:  # Eliminate "0.0", "1.0" floats
                    newrow[i + 4].value = unicode(int(newrow[i + 4].value))

                if col.ctype == 1:
                    newrow[i + 4].value = u"{0}\n{1}".format(newrow[i + 4].value, col.value)
                elif col.ctype == 2:
                    newrow[i + 4].value = u"{0}\n{1}".format(newrow[i + 4].value, int(col.value))

        # This is vehicle info that fled to the bottom of the page.  Remember
        # it for appending upon pagebreak.
        elif rowtype == MISSING_VEHICLE:
            missing_vehicles.append(row)

        # These happen too!  Awesome!
        elif rowtype == MISSING_CONTRIBUTING:
            missing_contributing.append(row)

        # A pagebreak means we should add our missing vehicle data to any
        # rows that need it, and clear out the missing vehicle data.
        elif rowtype == PAGE_BREAK:

            if len(data_missing_vehicles) == 0 and \
               len(missing_vehicles) == 0 and \
               len(data_missing_contributing) == 0 and \
               len(missing_contributing) == 0:
                continue

            if len(data_missing_vehicles) > 0 and len(missing_vehicles) == 0:
                #raise ParserException(u"Found data with missing vehicles, but no "
                #                      u"vehicles to link them back to",
                #                      filename, rnum, data_missing_vehicles)
                pass  # There can be blank rows for this.

            elif len(data_missing_vehicles) == 0 and len(missing_vehicles) > 0:
                raise ParserException(u"Found missing vehicles, but no data "
                                      u"to link them back to", filename, rnum,
                                      missing_vehicles)

            if len(data_missing_contributing) > 0 and len(missing_contributing) == 0:
                #raise ParserException(u"Found data with missing contributing "
                #                      u"factors, but no factors to link them "
                #                      u"back to.", filename, rnum,
                #                      data_missing_contributing)
                pass  # There can be blank rows for this.

            elif len(data_missing_contributing) == 0 and len(missing_contributing) > 0:
                raise ParserException(u"Found missing contributing factors, "
                                      u"but no data to link them back to",
                                      filename, rnum, missing_contributing)

            # There can be several cells of missing data per page (!), but the
            # data itself appears to be alphabetical, so an out-of-order
            # row means that we've moved to the next row of missing data.

            prior_mv_order = None
            for mv in missing_vehicles:
                # Of course, it's not consistent on alphabetics: 'other' and
                # 'unknown' come after everything else.
                mv_order = mv[0].value.lower()
                if mv_order.startswith('other'):
                    mv_order = 'z'
                elif mv_order.startswith('unknown'):
                    mv_order = 'zz'

                if not prior_mv_order is None and mv_order < prior_mv_order:
                    if len(data_missing_vehicles) > 1:
                        data_missing_vehicles.pop(0)
                    else:
                        raise ParserException(u"There appear to be more "
                                              u"missing vehicles than data "
                                              u"for them", filename, rnum, mv)

                data = data_missing_vehicles[0]
                if data[mapping[VEHICLE] + 4]:
                    data[mapping[VEHICLE] + 4].value += u'\n' + mv[0].value
                else:
                    data[mapping[VEHICLE] + 4].value = mv[0].value
                prior_mv_order = mv_order

            prior_mc_order = None
            for mc in missing_contributing:
                mc_order = mv[0].value.lower()

                if not prior_mc_order is None and mc_order < prior_mc_order:
                    if len(data_missing_contributing) > 1:
                        data_missing_contributing.pop(0)
                    else:
                        raise ParserException(u"There appear to be more "
                                              u"missing contributing factors "
                                              u"than data for them", filename,
                                              rnum, mv)

                data = data_missing_contributing[0]
                if data[mapping[CONTRIBUTING] + 4]:
                    data[mapping[CONTRIBUTING] + 4].value += u'\n' + mc[0].value
                else:
                    data[mapping[CONTRIBUTING] + 4].value = mc[0].value
                prior_mc_order = mc_order

            # This happens.
            #if len(data_missing_vehicles) > 1:
            #    raise ParserException(u"Could not find missing vehicles for "
            #                          u"one or more rows which is missing "
            #                          u"vehicles", filename, rnum,
            #                          data_missing_vehicles)

            #if len(data_missing_contributing) > 1:
            #    raise ParserException(u"Could not find missing factors for "
            #                          u"one or more rows which is missing "
            #                          u"contributing factors", filename, rnum,
            #                          data_missing_contributing)

            data_missing_vehicles = []
            missing_vehicles = []
            data_missing_contributing = []
            missing_contributing = []

    for row in filtered_rows:
        borocode = row[0]
        precinct = row[1]

        intersection = row[mapping[INTERSECTION] + 4].value.split(u'and')
        injured = row[mapping[INJURED] + 4].value.split(u'\n')
        killed = row[mapping[KILLED] + 4].value.split(u'\n')

        lonlat = None
        street1 = intersection[0].strip().replace(u'\n', u' ')
        street2 = intersection[1].strip().replace(u'\n', u' ')

        key1 = (borocode, street1.lower(), street2.lower())
        key2 = (borocode, street2.lower(), street1.lower())
        lonlat = intersections_lonlat_dict.get(key1) or intersections_lonlat_dict.get(key2)

        if lonlat is None:
            if GEOCODER is not None:
                lonlat = geocode_intersection(street1, street2, borocode)
            if lonlat is None:
                lonlat = ('', '')
            else:
                intersections_lonlat_dict[(borocode,
                                           street1.lower(),
                                           street2.lower())] = lonlat
                intersections_lonlat_dict[(borocode,
                                           street2.lower(),
                                           street1.lower())] = lonlat
                write_intersections_file(borocode, precinct, street1,
                                             street2, lonlat)

        vehicles = {}
        contributing_factors = {}

        overflow = False  # This is used for cases where the value is not on
                          # same line as the vehicle/contributing factor

        vehicle = None
        if row[mapping[VEHICLE] + 4].ctype != 0:
            for line in row[mapping[VEHICLE] + 4].value.split(u'\n'):
                if overflow == True:
                    count = re.findall(r' (\d+)$', line)
                    if count:
                        vehicles[vehicle] = int(count[0])
                        overflow = False
                    else:
                        continue

                else:
                    vehicle = None
                    for v in VEHICLES:
                        vmatch = v[0:5]
                        if line.find(vmatch) != -1:
                            vehicle = v
                    if vehicle is None and re.findall(r' (\d+)$', line):
                        raise ParserException(u"Could not match {0} to vehicle".format(
                            line), filename, rnum, row)
                    count = re.findall(r' (\d+)$', line)
                    if count:
                        vehicles[vehicle] = int(count[0])
                    else:
                        overflow = True

        contributing = None
        if row[mapping[CONTRIBUTING] + 4].ctype != 0:
            for line in row[mapping[CONTRIBUTING] + 4].value.split(u'\n'):
                if overflow == True:
                    count = re.findall(r' (\d+)$', line)
                    if count:
                        contributing_factors[contributing] = int(count[0])
                        overflow = False
                    else:
                        continue

                else:
                    contributing = None
                    for c in CONTRIBUTING_FACTORS:
                        cmatch = c[0:5]
                        if line.find(cmatch) != -1:
                            contributing = c
                    if contributing is None and re.findall(r' (\d+)$', line):
                        raise ParserException(u"Could not match {0} to "
                                              u"contributing".format(
                                                  line), filename, rnum, row)
                    count = re.findall(r' (\d+)$', line)
                    if count:
                        contributing_factors[contributing] = int(count[0])
                    else:
                        overflow = True

        print_row = [borocode,
                     row[1],
                     row[2],
                     row[3],
                     lonlat[0],
                     lonlat[1],
                     intersection[0].strip().replace('\n', ' '),
                     intersection[1].strip().replace('\n', ' '),
                     int(row[mapping[COLLISIONS] + 4].value),
                     int(row[mapping[PERSONS] + 4].value),
                     int(row[mapping[COLLISIONS_WITH_INJURY] + 4].value),
                     int(injured[0]),
                     int(injured[1]),
                     int(injured[2]),
                     int(injured[3]),
                     int(injured[4]),
                     int(killed[0]),
                     int(killed[1]),
                     int(killed[2]),
                     int(killed[3]),
                     int(killed[4])]

        for v in sorted(VEHICLES):
            print_row.append(vehicles.get(v, ''))

        for c in sorted(CONTRIBUTING_FACTORS):
            print_row.append(contributing_factors.get(c, ''))

        print(u'\t'.join(unicode(c) for c in print_row))


if __name__ == '__main__':
    if len(sys.argv) < 2:
        sys.stderr.write("""
    usage: {0} <files>
    \n""".format(sys.argv[0]))
        sys.exit(1)

    intersections_lonlat_dict = read_intersections_lonlat_dict(INTERSECTIONS_LONLAT_PATH)
    print_header()
    for path in sys.argv[1:]:
        name = os.path.basename(path)
        if name.endswith('acc.xlsx') and name[0:2] in ('bk', 'bx', 'mn', 'qn', 'si'):
            sys.stderr.write(u"{0}\n".format(path))
            try:
                process_accidents(path, intersections_lonlat_dict)
            except ParserException as e:
                sys.stderr.write("Parser error: {0}\n".format(e))
