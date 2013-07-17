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
 * @extends L.Icon
 */
LetsMap.Icon = L.DivIcon.extend({
    options: {
        iconSize: new L.Point(0, 0),
        className: 'intersection-marker'
    },

    ratioMap: _.map(_.range(0, 8), function (v) { return "size" + v; }),

    /**
     * Override createIcon.
     */
    createIcon: function () {
        var div,
            $div,
            $slider = this.options.$slider,
            marker = this.options.marker,
            popup,
            self = this;
            //template = this._template.html();

        // call parent method explicitly
        div = L.DivIcon.prototype.createIcon.call(this);
        $div = $(div);

        if (this.options.aggregate === true) {
            $div.addClass('aggregate');
        } else {
            $div.addClass('single');
        }

        this.$subDiv = $('<div />').appendTo($div.data('letsmap', {
            data: this.options.data,
            count: this.options.count
        }));

        // create popup and bind mouseover
        popup = this.popup = new L.Popup({
            data: this.options.data,
            streetName: this.options.streetName,
            count: this.options.count,
            aggregate: this.options.aggregate
        });

        marker.bindPopup(this.popup);

        return div;
    }
});
