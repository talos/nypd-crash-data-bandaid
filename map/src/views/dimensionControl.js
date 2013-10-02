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
/*globals $, Crashmapper, L, _*/

/**
 * @constructor
 * @extends L.Control
 */
Crashmapper.DimensionControl = L.Control.extend({
    options: {
        position: 'topright',
        dimension: 'collisions'
    },

    onAdd: function (map) {
        var div = L.DomUtil.create('div', 'dimension-control leaflet-bar'),
            dimensions = this._dimensions = {},
            self = this;
        div.innerHTML = $('#dimensionControlTemplate').html();
        //this.dimension = this.options.dimension;
        $.each($('a', div), function (i, el) {
            var $el = $(el),
                dim = $el.attr('href').slice(1),
                defaultVolume = Number($el.attr('data-volume'));
            dimensions[dim] = $el;
            $el.on('click', function (evt) {
                evt.preventDefault();
                self.selectDimension(dim, defaultVolume, $el.attr('title'));
                return false;
            });
            if (dim === self.options.dimension) {
                map.on('ready', function () {
                    $el.trigger('click');
                });
            }
        });
        //this.highlightCurrentDimension();
        //self.selectDimension(this.options.dimension);

        return div;
    },

    highlightCurrentDimension: function () {
        var curDim = this.dimension;
        _.each(this._dimensions, _.bind(function ($el, dim) {
            if (curDim === dim) {
                $el.addClass('selected');
                //this.updateTitle($el.attr('title'));
            } else {
                $el.removeClass('selected');
            }
        }, this));
    },

    selectDimension: function (dim, defaultVolume, dimTitle) {
        if (this.dimension === dim || !_.has(this._dimensions, dim)) {
            return;
        }
        this.dimension = dim;
        this.dimensionTitle = dimTitle;
        this.highlightCurrentDimension();
        this._map.fire('dimensionchange', {
            title: dimTitle,
            defaultVolume: defaultVolume
        });
    },

    getDimensionFunction: function (volume) {
        var dimension = this.dimension;
        // crazy performance penalties otherwise!
        if (dimension === 'collisions-with-injuries') {
            dimension = 'collisionsWithInjuries';
        }
        if (dimension.slice(-8) === '-injured') {
            dimension = dimension.slice(0, -8);
            return function (data, len, cnt) {
                var sum = 0, i = data.length - 1, d;
                while (i >= 0) {
                    d = data[i][dimension];
                    sum += d ? d.injured : 0;
                    i -= 1;
                }

                return sum * volume / (cnt * len);
            };
        } else {
            return function (data, len, cnt) {
                var sum = 0, i = data.length - 1;
                while (i >= 0) {
                    sum += data[i][dimension] || 0;
                    i -= 1;
                }
                return sum * volume / (cnt * len);
            };
        }
    }
});
