/***
   * Copyright (c) 2013 John Krauss.
   *
   * This file is part of Crashmapper.
   *
   * Crashmapper is free software: you can redistribute it and/or modify
   * it under the terms of the GNU General Public License as published by
   * the Free Software Foundation, either version 3 of the License, or
   * (at your option) any later version.
   *
   * Crashmapper is distributed in the hope that it will be useful,
   * but WITHOUT ANY WARRANTY; without even the implied warranty of
   * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
   * GNU General Public License for more details.
   *
   * You should have received a copy of the GNU General Public License
   * along with Crashmapper.  If not, see <http://www.gnu.org/licenses/>.
   *
   ***/

/*jslint browser: true, nomen: true, sloppy: true*/
/*globals Crashmapper, L, _*/

/**
 * @constructor
 * @param {Object} data
 * @extends {L.Marker}
 */
Crashmapper.Marker = L.Marker.extend({

    options: {
    },

    _categories: ['cyclists', 'motorists', 'passengers', 'pedestrians', 'total'],

    /**
     * @param {Object} data
     * @this {L.Marker}
     */
    initialize: function (data) {
        var latlng = new L.LatLng(data[0], data[1]),
            streetName = data[2] + ' and ' + data[3];
        this._data = this._processData(data);

        L.Marker.prototype.initialize.call(this, latlng);
        this.options.icon = new Crashmapper.Icon({
            data: this._data,
            streetName: streetName,
            marker: this,
            count: 1,
            latlng: latlng
        });
    },

    /**
     * Process the data for this marker from flat format to something readable
     * faster.
     * @param {Object} data
     * @this {L.Marker}
     */
    _processData: function (data) {
        var processedData = [],
            categories = this._categories,
            i,
            j,
            d,
            pd;
        for (i = 4; i < data.length; i += 1) {
            d = data[i];
            pd = {
                collisionsWithInjuries: 0,
                collisions: 0,
                involved: 0,
                other: {}
            };

            // Signal that we should skip this element n times, decrement
            // and re-read.
            if (_.isNumber(d)) {
                if (d > 0) {
                    data[i] = d - 1;
                    i -= 1;
                    processedData.push(pd);
                }
            } else {
                pd.collisionsWithInjuries = d[0];
                pd.collisions = d[1];
                pd.involved = d[2];
                // Main categories, injured/killed counts
                for (j = 3; j < 8; j += 1) {
                    if (d[j][0] > 0 || d[j][1] > 0) {
                        pd[categories[j - 3]] = {
                            injured: d[j][0],
                            killed: d[j][1]
                        };
                    }
                }
                // Vehicle categories, # involved
                /*for (j = 8; j < d.length; j += 1) {
                    pd.other[d[j][0]] = d[j][1];
                }*/
                // vehicle categories are now in 8, factors in 9
                processedData.push(pd);
            }
        }
        return processedData;
    },

    /**
     * Shared function to aggregate data across many markers.
     */
    _aggregateData: function (markers) {
        var aggregate = [],
            t = markers.length - 1,
            i,
            data,
            len,
            d,
            dm;

        while (t >= 0) {
            data = markers[t]._data;
            len = data.length;
            for (i = 0; i < len; i += 1) {
                d = data[i];
                dm = aggregate[i];
                if (!dm) {
                    dm = aggregate[i] = {};
                }
                this.addDataPoint(dm, d);
            }

            t -= 1;
        }

        return aggregate;
        // post-process into array for templating
        /*aggregated.other = _.map(aggregated.other, function (v, k) {
            return {
                vehicle_type: k,
                vehicle_count: v
            };
        });*/
    },

    /**
     * Fast static function to merge data points together.
     *
     * Add 'd' to 'dm'.  Modifies 'dm'.
     *
     * Returns nothing.
     */
    addDataPoint: function (dm, d) {
        if (!d) { return; }
        var dcyclists = d.cyclists,
            dmotorists = d.motorists,
            dpassengers = d.passengers,
            dpedestrians = d.pedestrians,
            dtotal = d.total,
            dmcyclists = dm.cyclists,
            dmmotorists = dm.motorists,
            dmpassengers = dm.passengers,
            dmpedestrians = dm.pedestrians,
            dmtotal = dm.total;
        dm.collisionsWithInjuries = dm.collisionsWithInjuries ?
                dm.collisionsWithInjuries + d.collisionsWithInjuries :
                d.collisionsWithInjuries;
        dm.collisions = dm.collisions ?
                dm.collisions + d.collisions :
                d.collisions;
        dm.involved = dm.involved ?
                dm.involved + d.involved :
                d.involved;
        if (dcyclists) {
            if (dmcyclists) {
                dmcyclists.injured += dcyclists.injured;
                dmcyclists.killed += dcyclists.killed;
            } else {
                dm.cyclists = {
                    injured: dcyclists.injured,
                    killed: dcyclists.killed
                };
            }
        }
        if (dmotorists) {
            if (dmmotorists) {
                dmmotorists.injured += dmotorists.injured;
                dmmotorists.killed += dmotorists.killed;
            } else {
                dm.motorists = {
                    injured: dmotorists.injured,
                    killed: dmotorists.killed
                };
            }
        }
        if (dpassengers) {
            if (dmpassengers) {
                dmpassengers.injured += dpassengers.injured;
                dmpassengers.killed += dpassengers.killed;
            } else {
                dm.passengers = {
                    injured: dpassengers.injured,
                    killed: dpassengers.killed
                };
            }
        }
        if (dpedestrians) {
            if (dmpedestrians) {
                dmpedestrians.injured += dpedestrians.injured;
                dmpedestrians.killed += dpedestrians.killed;
            } else {
                dm.pedestrians = {
                    injured: dpedestrians.injured,
                    killed: dpedestrians.killed
                };
            }
        }
        if (dtotal) {
            if (dmtotal) {
                dmtotal.injured += dtotal.injured;
                dmtotal.killed += dtotal.killed;
            } else {
                dm.total = {
                    injured: dtotal.injured,
                    killed: dtotal.killed
                };
            }
        }
        /*_.each(d.other, function (v, k) {
          dm.other[k] = dm.other[k] ? dm.other[k] + v : v;
          });*/

    }
});

