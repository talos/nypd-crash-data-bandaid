#!/usr/bin/env python

import csv
import os
import json

from generateAccidentSummaries import ALL_ACCIDENTS_NAME, PATH_TO_DATA

JSON_OUT_NAME = 'all_accidents.json'

# Convert the `all_accidents.csv` file into a more packed JSON format for
# mapping purposes.

def blank_subdatum():
    return {
        'accidents_with_injuries': 0,
        'accidents': 0,
        'involved': 0,
        'Cyclists': [0, 0],
        'Motorists': [0, 0],
        'Passengers': [0, 0],
        'Pedestr': [0, 0],
        'Total': [0, 0],
        'other': {}}

def run():
    # [lon, lat, [(num of times to skip),
    #             [ AccwInjuries, Acc, Inv,
    #             [ (Cyclists) Inj, Killed],
    #             [ (Motorists) Inj, Killed],
    #             [ (Passengers) Inj, Killed],
    #             [ (Pedestr) Inj, Killed],
    #             [ (Total) Inj, Killed],
    #             [ vehicle_type, vehicle_count], ... (for every time, int to skip) ]
    #

    # first pass -- create data_by_lonlat dict with lonlat keys, and subdatum
    # dicts
    #data_by_xyz = {}
    data_by_lonlat = {}
    times = set()
    #avg_x_by_z = {}
    #avg_y_by_z = {}
    #cnt_by_z = {}
    with open(os.path.join(PATH_TO_DATA, ALL_ACCIDENTS_NAME)) as all_accidents:
        for line in csv.reader(all_accidents, delimiter=','):
            year, month, precinct, street_name, lon, lat, accidents_with_injuries, accidents, involved, category, injured, killed, vehicle_type, vehicle_count = line

            # Skip any header rows in there
            if year == 'year':
                continue

            # Skip any non-geocoded rows
            if not lat or not lon:
                continue

            time = year + month
            times.add(time)
            len_times = len(times)

            #for z in xrange(3, 6): # 14 is lossless
            #for z in [3, 5, 14]:
            #for z in [3, 4, 5, 6, 14]:
            for z in [14]:
                #x = int((float(lon) + 74.266891) * pow(10, z / 2.0))
                #y = int((float(lat) - 40.492825) * pow(10, z / 2.0))
                #avg_x = avg_x_by_z.get(z, 0.0)
                #avg_y = avg_y_by_z.get(z, 0.0)
                #cnt_by_z[z] = cnt_by_z.get(z, 0) + 1
                #cnt = cnt_by_z[z]
                #avg_x_by_z[z] = (x + (avg_x * (cnt - 1))) / cnt
                #avg_y_by_z[z] = (y + (avg_y * (cnt - 1))) / cnt

                # skip out-of-bounds points
                #if x < 0 or y < 0:
                #    continue

                #xyz = (x, y, z)
                lonlat = (lon, lat)
                #datum = data_by_xyz.get(xyz, None)
                datum = data_by_lonlat.get(lonlat, None)

                # Signal proper skip if nonexistent data for lonlat
                if datum is None:
                    if len_times == 1:
                        datum = [blank_subdatum()]
                    else:
                        datum = [len_times, blank_subdatum()]
                    #data_by_xyz[xyz] = datum
                    data_by_lonlat[lonlat] = datum

                # Add skip if there was missing data in interim, then create a
                # subdatum or grab the last subdatum
                len_datum = len(datum)
                datum_len_diff = len_times - len_datum
                if datum_len_diff > 0:
                    datum.append(datum_len_diff)
                    datum.append(blank_subdatum())
                else:
                    subdatum = datum[-1]

                # provide addition for zoomed-out points not yet touched
                #xyzs = subdatum['xyzs']
                #if xyz not in xyzs:
                #    xyzs.add(xyz)
                subdatum['accidents_with_injuries'] = int(accidents_with_injuries)
                subdatum['accidents'] = int(accidents)
                subdatum['involved'] = int(involved)

                if category:
                    subdatum[category][0] += int(injured)
                    subdatum[category][1] += int(killed)
                else:
                    try:
                        subdatum_other = subdatum['other']
                        if vehicle_type in subdatum_other:
                            subdatum_other[vehicle_type] += int(vehicle_count)
                        else:
                            subdatum_other[vehicle_type] = int(vehicle_count)

                    # TODO -- currently skip problematic vehicle_count (see
                    # staten island dec. "2011 GLEN STREET and VICTORY BOULEVARD"
                    except ValueError:
                        continue

    # Second pass -- convert to dict of grids
    #grids_by_z = {
    #    "avg_x_by_z": avg_x_by_z,
    #    "avg_y_by_z": avg_y_by_z
    #}
    #for xyz, datum in data_by_xyz.iteritems():

    #    x, y, z = xyz
    #    buckets = z * 2
    #    max_x = avg_x_by_z[z] * 2
    #    max_y = avg_y_by_z[z] * 2
    #    x_divisor = float(max_x + 1) / buckets
    #    y_divisor = float(max_y + 1) / buckets

    #    x_bucket = int(x / x_divisor)
    #    y_bucket = int(y / y_divisor)

    #    # Skip out-of-bounds data
    #    if x_bucket > buckets or y_bucket > buckets:
    #        continue

    #    # Fill buckets
    #    grid = grids_by_z.get(z, None)
    #    if grid is None:
    #        grid = map(lambda i: map(lambda i: [], [None] * buckets),
    #                   [None] * buckets)
    #        grids_by_z[z] = grid

    #    # convert hash subdatum to list
    #    for i, subdatum in enumerate(datum):
    #        if type(subdatum) == dict:
    #            new_subdatum = [subdatum['accidents_with_injuries'],
    #                            subdatum['accidents'],
    #                            subdatum['involved'],
    #                            subdatum['Cyclists'],
    #                            subdatum['Motorists'],
    #                            subdatum['Passengers'],
    #                            subdatum['Pedestr'],
    #                            subdatum['Total']]
    #            for vehicle_type, vehicle_count in subdatum['other'].iteritems():
    #                new_subdatum.append([vehicle_type, vehicle_count])
    #            datum[i] = new_subdatum

    #    datum.insert(0, y)
    #    datum.insert(0, x)

    #    grid[x_bucket][y_bucket].append(datum)

    # Second pass -- convert to list
    data_list = []
    for lonlat, datum in data_by_lonlat.iteritems():
        lon, lat = lonlat
        # convert hash subdatum to list
        for i, subdatum in enumerate(datum):
            if type(subdatum) == dict:
                new_subdatum = [subdatum['accidents_with_injuries'],
                                subdatum['accidents'],
                                subdatum['involved'],
                                subdatum['Cyclists'],
                                subdatum['Motorists'],
                                subdatum['Passengers'],
                                subdatum['Pedestr'],
                                subdatum['Total']]
                for vehicle_type, vehicle_count in subdatum['other'].iteritems():
                    new_subdatum.append([vehicle_type, vehicle_count])
                datum[i] = new_subdatum

        datum.insert(0, lon)
        datum.insert(0, lat)
        data_list.append(datum)

    json.dump(data_list, open(os.path.join(PATH_TO_DATA, JSON_OUT_NAME), 'w'),
              separators=(',', ':'))

if __name__ == '__main__':
    run()
