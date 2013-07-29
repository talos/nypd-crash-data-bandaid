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

/*jslint browser: true, nomen: true, vars: true, sloppy: true*/
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
        var latlng = new L.LatLng(data.shift(), data.shift());
        var streetName = data.shift() + ' and ' + data.shift();
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
        for (i = 0; i < data.length; i += 1) {
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
        return _.reduce(markers, this._aggregateSingleMarker, []);
        // post-process into array for templating
        /*aggregated.other = _.map(aggregated.other, function (v, k) {
            return {
                vehicle_type: k,
                vehicle_count: v
            };
        });*/
    },

    _aggregateSingleMarker: function (memo, m) {
        var i = 0,
            data = m._data,
            len = data.length,
            d;
        for (i; i < len; i += 1) {
            d = data[i];
            if (!memo[i]) {
                memo[i] = {
                    collisionsWithInjuries: 0,
                    collisions: 0,
                    involved: 0,
                    other: {}
                };
            }
            var dm = memo[i],
                dcyclists = d.cyclists,
                dmotorists = d.motorists,
                dpassengers = d.passengers,
                dpedestrians = d.pedestrians,
                dtotal = d.total,
                dmcyclists = dm.cyclists,
                dmmotorists = dm.motorists,
                dmpassengers = dm.passengers,
                dmpedestrians = dm.pedestrians,
                dmtotal = dm.total;
            dm.collisionsWithInjuries += d.collisionsWithInjuries;
            dm.collisions += d.collisions;
            dm.involved += d.involved;
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
        return memo;
    }
});

