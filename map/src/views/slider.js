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
LetsMap.Slider = L.Control.extend({
    options: {
        position: 'bottomleft',
        min: 7,
        max: 29
    },

    onAdd: function (map) {
        var div = L.DomUtil.create('div', 'slider-control'),
            self = this,
            helpText = 'Drag me to change the date!';
        div.innerHTML = $('#sliderTemplate').html();
        this.$slider = $('#slider', div).slider({
            max: this.options.max,
            min: this.options.min,
            value: this.options.value || this.options.max,
            animate: true
        }).on('slide', function (e, ui) {
            map.fire('slide', self.getValue(ui.value));
            self._updateCurrentDiv(ui.value);
        }).on('slidestart', function (e) {
            map.dragging.disable();
        }).on('slidestop', function (e) {
            map.dragging.enable();
        });
        $('a.ui-slider-handle', this.$slider).attr({
            alt: helpText,
            title: helpText
        });
        $('#slider-min', div).text(this._prettyValue(this.options.min));
        $('#slider-max', div).text(this._prettyValue(this.options.max));
        this.$currentDiv = $('#slider-current .time', div);
        this._updateCurrentDiv();
        return div;
    },

    onRemove: function (map) {
    },

    _updateCurrentDiv: function (idx) {
        this.$currentDiv.text(this._prettyValue(idx));
    },

    getValue: function (idx) {
        idx = idx || this.$slider.slider('value');
        return {
            month: idx % 12,
            year: Math.floor(idx / 12) + 2011,
            idx: idx - this.options.min
        };
    },

    _prettyValue: function (idx) {
        var value = this.getValue(idx);
        return (value.month + 1) + '/' + value.year;
    },

    setValue: function (year, month) {
        var idx = ((year - 2011) * 12) + month;
        this.$slider.slider('value', idx);
        this._updateCurrentDiv(idx);
    }
});
