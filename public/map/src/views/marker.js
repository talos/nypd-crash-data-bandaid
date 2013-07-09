/***
   * Copyright (c) 2012 John Krauss.
   *
   * This file is part of letsmap.
   *
   * letsmap is free software: you can redistribute it and/or modify
   * it under the terms of the GNU General Public License as published by
   * the Free Software Foundation, either version 3 of the License, or
   * (at your option) any later version.
   *
   * letsmap is distributed in the hope that it will be useful,
   * but WITHOUT ANY WARRANTY; without even the implied warranty of
   * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
   * GNU General Public License for more details.
   *
   * You should have received a copy of the GNU General Public License
   * along with letsmap.  If not, see <http://www.gnu.org/licenses/>.
   *
   ***/

/*jslint browser: true, nomen: true, vars: true*/
/*globals Backbone, $, LetsMap, Mustache, L, _*/
"use strict";

/**
 * @constructor
 * @param {Object} data
 * @extends {L.Marker}
 */
LetsMap.Marker = L.Marker.extend({

    options: {
        icon: new LetsMap.Icon(),
        clickable: false
    },

    _template: $('#markerTemplate'),

    /**
     * @param {Object} data
     * @this {L.Marker}
     */
    initialize: function (data, slider) {
        this._latlng = new L.LatLng(data[0], data[1]);
        this._slider = slider;
        this._data = this._processData(data.slice(2));

        // bind a popup
        this.popup = new L.Popup({
            closeButton: false,
            offset: new L.Point(0, 55)
        });
        this.popup.setLatLng(this._latlng);
    },

    /**
     * @param {Number} idx The index for which to get the weight of this
     * marker.
     * @this {L.Marker}
     */
    getWeight: function (idx) {
        return _.pluck(this._data, 'accidents');
    },

    /**
     * Process the data for this marker from flat format to something readable
     * faster.
     * @param {Object} data
     * @this {L.Marker}
     */
    _processData: function (data) {
        var processedData = [],
            categories = ['cyclists', 'motorists', 'passengers', 'pdestr',
                'total'],
            i,
            j,
            d,
            pd;
        for (i = 0; i < data.length; i += 1) {
            d = data[i];
            pd = {
                accidentsWithInjuries: 0,
                accidents: 0,
                involved: 0,
                other: {}
            };

            // Signal that we should skip this element n times, decrement
            // and re-read.
            if (_.isNumber(d)) {
                if (d > 0) {
                    data[i] = d - 1;
                    i -= 1;
                }
            } else {
                pd.accidentsWithInjuries = d[0];
                pd.accidents = d[1];
                pd.involved = d[2];
                for (j = 3; j < 8; j += 1) {
                    pd[categories[j - 2]] = {
                        injured: d[j][0],
                        killed: d[j][1]
                    };
                }
                for (j = 8; j < d.length; j += 1) {
                    pd.other[d[j][0]] = d[j][1];
                }
            }
            processedData.push(pd);
        }
        return processedData;
    },

    /**
     * Override initIcon to show popup on rollover.
     */
    _initIcon: function () {
        var popup = this.popup,
            map = this._map,
            template = this._template,
            data = this._data,
            slider = this._slider;
        L.Marker.prototype._initIcon.call(this);
        $(this._icon).on('mouseenter', function () {
            popup.setContent(Mustache.render(template.html(), data[slider.getIdx()]));
            map.openPopup(popup);
        });
        $(this._icon).on('mouseleave', function () {
            map.closePopup();
        });
        /*$(this._icon).on('click', function (e) {
            console.log(e);
        });*/
    }
});

