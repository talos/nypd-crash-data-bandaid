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

/*jslint browser: true, nomen: true*/
/*globals Backbone, $, LetsMap, Mustache, L, _*/
"use strict";

/**
 * @constructor
 * @extends L.Control
 */
LetsMap.DimensionControl = L.Control.extend({
    options: {
        position: 'topright',
        dim1: 'accidents',
        mult: 2
    },

    onAdd: function (map) {
        var div = L.DomUtil.create('div', 'dimension-control leaflet-bar'),
            self = this;
        div.innerHTML = $('#dimensionControlTemplate').html();
        $(div, 'a').on('click', function (evt) {
            evt.preventDefault();
            var $el = $(evt.target);
            if (!$el.attr('href')) { // handle when image receives click
                $el = $el.parent();
            }
            self.selectDimension.apply(self, $el.attr('href').slice(1).split('/'));
            return false;
        });
        this.highlightCurrentDimension(div);
        return div;
    },

    highlightCurrentDimension: function (el) {
        var href = '#' + this.options.mult + '/' + this.options.dim1,
            $el = $(el);
        if (this.options.dim2) {
            href = href + '/' + this.options.dim2;
        }
        $el.children('a').removeClass('selected');
        $el.children('a[href="' + href + '"]').addClass('selected');
    },

    selectDimension: function (mult, dim1, dim2) {
        var trigger = false,
            href,
            el;
        if (this.options.dim1 !== dim1 || this.options.dim2 !== dim2) {
            trigger = true;
        }
        this.options.mult = Number(mult);
        this.options.dim1 = dim1;
        this.options.dim2 = dim2;
        if (trigger) {
            this.highlightCurrentDimension(this.getContainer());
            this._map.fire('dimensionchange');
        }
    },

    getDimensionFunction: function () {
        var mult = this.options.mult,
            dim1 = this.options.dim1,
            dim2 = this.options.dim2;
        if (!dim2) {
            return function (d, cnt) {
                return d[dim1] * mult / cnt;
            };
        } else {
            return function (d, cnt) {
                return d[dim1] ? d[dim1][dim2] * mult / cnt : 0;
            };
        }
    },

    onRemove: function (map) {

    }
});
