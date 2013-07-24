#!/usr/bin/env python

import csv
import json
import sys

from process_collisions import VEHICLE_COLUMNS, CONTRIBUTING_COLUMNS


def blank_subdatum():
    return {
        'collisions_with_injuries': 0,
        'collisions': 0,
        'persons_involved': 0,
        'cyclists': [0, 0],
        'motorists': [0, 0],
        'passengers': [0, 0],
        'pedestr': [0, 0],
        'total': [0, 0],
        'factors': {},
        'vehicles': {}}


def run(path):
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

    sys.stderr.write(u"Starting CSV to JSON conversion...\n")
    data_by_lonlat = {}
    times = set()
    with open(path) as collisions:
        for line in csv.DictReader(collisions, delimiter='\t'):

            lon, lat = line.pop('lon'), line.pop('lat')

            # Skip any non-geocoded rows
            if not lon or not lat:
                continue

            year, month = int(line.pop('year')), int(line.pop('month'))
            time = year * 100 + month

            times.add(time)
            len_times = len(times)

            lonlat = (lon, lat)
            datum = data_by_lonlat.get(lonlat, None)

            street1, street2 = line['street1'], line['street2']

            # Signal proper skip if nonexistent data for lonlat
            if datum is None:
                if len_times == 1:
                    datum = [street1, street2, blank_subdatum()]
                else:
                    datum = [street1, street2, len_times - 1, blank_subdatum()]
                data_by_lonlat[lonlat] = datum

            # Add skip if there was missing data in interim, then create a
            # subdatum or grab the last subdatum
            #len_datum = len(datum)
            len_datum = sum(map(lambda d: 1 if isinstance(d, dict) else d, datum[2:]))
            datum_len_diff = len_times - len_datum
            if datum_len_diff > 1:
                datum.append(datum_len_diff - 1)
                datum.append(blank_subdatum())
            elif datum_len_diff == 1:
                datum.append(blank_subdatum())

            subdatum = datum[-1]

            for k in (u'collisions_with_injuries', u'collisions', u'persons_involved'):
                subdatum[k] = int(line.pop(k))

            for cat in (u'cyclists', u'pedestr', u'motorists', u'passengers', u'total'):
                for i, end in enumerate((u'injured', u'killed')):
                    subdatum[cat][i] += int(line.pop(cat + u'_' + end))

            vehicles_sd = subdatum['vehicles']
            for v in VEHICLE_COLUMNS:
                if line[v]:
                    vehicles_sd[v] = vehicles_sd.get(v, 0) + int(line.pop(v))

            factors_sd = subdatum['factors']
            for f in CONTRIBUTING_COLUMNS:
                if line[f]:
                    factors_sd[f] = factors_sd.get(f, 0) + int(line.pop(f))

    sys.stderr.write(u"Converting CSV to JSON, converted to dict...\n")

    # Second pass -- convert to list
    data_list = []
    for lonlat, datum in data_by_lonlat.iteritems():
        lon, lat = lonlat
        # convert hash subdatum to list
        for i, subdatum in enumerate(datum[2:]):
            if type(subdatum) == dict:
                new_subdatum = [subdatum['collisions_with_injuries'],
                                subdatum['collisions'],
                                subdatum['persons_involved'],
                                subdatum['cyclists'],
                                subdatum['motorists'],
                                subdatum['passengers'],
                                subdatum['pedestr'],
                                subdatum['total'],
                                [], []]
                for vehicle, cnt in subdatum['vehicles'].iteritems():
                    new_subdatum[-2].append([vehicle, cnt])
                for factor, cnt in subdatum['factors'].iteritems():
                    new_subdatum[-1].append([factor, cnt])

                datum[i + 2] = new_subdatum

        datum.insert(0, lon)
        datum.insert(0, lat)
        data_list.append(datum)

    sys.stderr.write(u"Finished converting CSV to JSON, converted to list\n")
    sys.stdout.write(json.dumps(data_list, separators=(',', ':')))


if __name__ == '__main__':
    if len(sys.argv) != 2:
        sys.stderr.write("""
    usage: {0} <collisions csv>
    \n""".format(sys.argv[0]))
        sys.exit(1)
    run(sys.argv[1])
