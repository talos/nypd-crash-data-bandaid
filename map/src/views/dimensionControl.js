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
        dimension: 'collisions',
        volume: 2
    },

    onAdd: function () {
        var div = L.DomUtil.create('div', 'dimension-control leaflet-bar'),
            dimensions = this._dimensions = {},
            self = this;
        div.innerHTML = $('#dimensionControlTemplate').html();
        this.volume = this.options.volume;
        this.dimension = this.options.dimension;
        $.each($('a', div), function (i, el) {
            var $el = $(el),
                dim = $el.attr('href').slice(1),
                volume = Number($el.attr('data-volume'));
            dimensions[dim] = $el;
            $el.on('click', function (evt) {
                evt.preventDefault();
                self.selectDimension(dim, volume);
                return false;
            });
        });
        this.highlightCurrentDimension();
        return div;
    },

    highlightCurrentDimension: function () {
        var curDim = this.dimension;
        _.each(this._dimensions, _.bind(function ($el, dim) {
            if (curDim === dim) {
                $el.addClass('selected');
                this.updateTitle($el.attr('title'));
            } else {
                $el.removeClass('selected');
            }
        }, this));
    },

    updateTitle: function (title) {
        $('#slider-current .layer').text(title);
    },

    selectDimension: function (dim, volume) {
        if (this.dimension === dim || !_.has(this._dimensions, dim)) {
            return;
        }
        this.dimension = dim;
        this.volume = volume;
        this.highlightCurrentDimension();
        this._map.fire('dimensionchange');
    },

    getDimensionFunction: function () {
        var volume = this.volume,
            dimension = this.dimension;
        // crazy performance penalties otherwise!
        if (dimension === 'collisions-with-injuries') {
            dimension = 'collisionsWithInjuries';
        }
        if (dimension.slice(-8) === '-injured') {
            dimension = dimension.slice(0, -8);
            return function (d, cnt) {
                return d[dimension] ? d[dimension].injured * volume / cnt : 0;
            };
        } else {
            return function (d, cnt) {
                return d[dimension] * volume / cnt;
            };
        }
    }
});
