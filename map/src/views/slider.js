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
/*globals $, Crashmapper, L*/

/**
 * @constructor
 * @extends L.Control
 */
Crashmapper.Slider = L.Control.extend({
    options: {
        position: 'bottomleft',
        min: 7,
        max: 29
    },

    onAdd: function (map) {
        var div = L.DomUtil.create('div', 'slider-control'),
            self = this,
            vals,
            helpText = 'Drag my handles to change start and end date!';
        div.innerHTML = $('#sliderTemplate').html();
        this.$slider = $('#slider', div).slider({
            max: this.options.max,
            min: this.options.min,
            range: true,
            step: true,
            values: (this.options.start && this.options.end) ?
                    [this.options.start, this.options.end] :
                    [this.options.min, this.options.max],
            animate: true
        }).on('slide', function (e, ui) {
            // Have to determine how we figure out which slider moved.
            map.fire('slide', {
                start: self.getValue(ui.values[0]),
                end: self.getValue(ui.values[1])
            });
            self._updateCurrentDiv(ui.values[0], ui.values[1]);
        }).on('slidestart', function (evt, ui) {
            map.dragging.disable();
        }).on('slidestop', function () {
            map.dragging.enable();
        });
        $('a.ui-slider-handle', this.$slider).attr({
            alt: helpText,
            title: helpText
        });
        $('#slider-min', div).html(this._prettyValue(this.options.min));
        $('#slider-max', div).html(this._prettyValue(this.options.max));
        this.$currentStartDiv = $('#slider-current .start-time', div);
        this.$currentEndDiv = $('#slider-current .end-time', div);
        vals = this.getValues();
        this._updateCurrentDiv(vals[0].idx, vals[1].idx);
        return div;
    },

    _months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep',
        'Oct', 'Nov', 'Dec'],

    _updateCurrentDiv: function (startIdx, endIdx) {
        this.$currentStartDiv.html(this._prettyValue(startIdx));
        this.$currentEndDiv.html(this._prettyValue(endIdx));
    },

    /**
     * Return month/year/data-idx hash for a specific slider idx.
     */
    getValue: function (idx) {
        return {
            month: idx % 12,
            year: Math.floor(idx / 12) + 2011,
            idx: idx - this.options.min
        };
    },

    getValues: function () {
        var idxs = this.$slider.slider('values');
        return [this.getValue(idxs[0]), this.getValue(idxs[1])];
    },

    _prettyValue: function (idx) {
        var value = this.getValue(idx);
        return this._months[value.month] + " &rsquo;" + (Number(value.year) - 2000);
    },

    setValues: function (startYear, startMonth, endYear, endMonth) {
        var startIdx = ((startYear - 2011) * 12) + startMonth,
            endIdx = ((endYear - 2011) * 12) + endMonth;
        if (startIdx === endIdx && startIdx > 0) {
            this.$slider.slider('values', 1, endIdx);
            this.$slider.slider('values', 0, startIdx);
        } else {
            this.$slider.slider('values', 0, startIdx);
            this.$slider.slider('values', 1, endIdx);
        }
        this._updateCurrentDiv(startIdx, endIdx);
    }
});
