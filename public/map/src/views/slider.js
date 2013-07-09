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

/*jslint sub: true, nomen: true, browser: true, maxlen: 79, vars: true*/
/*globals _, Backbone, $, LetsMap*/
"use strict";

/**
 * @constant {Object}
 */
var SLIDER_VIEW_DEFAULTS = {
    min: Math.round((2011 + (11 / 12)) * 12),
    max: Math.round((2013 + (4 / 12)) * 12)
};

/**
 * A slider view that emits 'drag' and 'endDrag' events with the current value
 * as the argument.
 * @param {Object} options
 * @constructor
 * @extends Backbone.View
 */
LetsMap.SliderView = Backbone.View.extend({

    className: 'slider',

    /**
     * @override
     * @param {Object} options
     * @this {LetsMap.SliderView}
     */
    initialize: function (options) {
        this.options = _.extend(SLIDER_VIEW_DEFAULTS, options);

        this.$marker = $('<div />').addClass('marker');
        this.$el.append(this.$marker);

        this.$blips = $('<div />').addClass('blips');
        this.$el.append(this.$blips);

        this.drag = _.bind(this.drag, this);

        /* Backbone can't have this property munged by closure. */
        this['events'] = {
            'mousedown .marker': _.bind(this.startDrag, this),
            'mousedown': _.bind(this.startHold, this),
            'mouseup': _.bind(this.endHold, this),
            'mouseleave': _.bind(this.endHold, this)
        };

        $(window).mouseup(_.bind(this.endDrag, this));

        // keep the marker's text in line with current value
        this.on('drag', this.render, this);

        this._initialLeftOffset = null;
    },

    /**
     * @this {LetsMap.SliderView}
     */
    initialLeftOffset: function () {
        if (this._initialLeftOffset === null) {
            this._initialLeftOffset = this.$marker.position().left;
        }
        return this._initialLeftOffset;
    },

    /**
     * @override
     * @this {LetsMap.SliderView}
     */
    render: function () {
        this.$marker.text(this.getValue());
        return this;
    },

    /**
     * A click on the slider -- bounce us one year to right or left.
     * @param {jQuery.event} evt
     * @this {LetsMap.SliderView}
     */
    click: function (evt) {
    },

    /**
     * A hold-down on the slider.  Move us towards one side.
     * @param {jQuery.event} evt
     * @this {LetsMap.SliderView}
     */
    startHold: function (evt) {
        var x = (evt.pageX - this.initialLeftOffset()) -
            this.$el.offset().left,
            initialLeftOffset = this.initialLeftOffset(),
            $marker = this.$marker,
            slider = this,
            fps = 15; // 15 years per second of hold

        this._holdSlider = setInterval(function () {
            var left = $marker.position().left - initialLeftOffset;
            var right = left + $marker.outerWidth();
            if (x > right) {
                slider.setValue(slider.getValue() + 1);
            } else if (x < left) {
                slider.setValue(slider.getValue() - 1);
            }
        }, 1000 / fps);
    },

    /**
     * Trigger end-of-hold.
     * @param {jQuery.event} evt
     * @this {LetsMap.SliderView}
     */
    endHold: function (evt) {
        clearInterval(this._holdSlider);
    },

    /**
     * @param {jQuery.event} evt
     * @this {LetsMap.SliderView}
     */
    startDrag: function (evt) {
        $(window).bind('mousemove', this.drag);
        return false;
    },

    /**
     * @param {jQuery.event} evt
     * @this {LetsMap.SliderView}
     */
    drag: function (evt) {

        var $el = this.$el,
            $marker = this.$marker,
            options = this.options,
            initialLeftOffset = this.initialLeftOffset();
        var x = (evt.pageX - this.initialLeftOffset()) -
            $el.offset().left;
        var width = $el.outerWidth();
        var markerWidth = $marker.outerWidth();
        width = width - markerWidth;
        var ratio = this.getRange() / width;

        x = x < 0 ? 0 : x;
        x = x > width ? width : x;

        x = Math.round(x * ratio) / ratio;

        $marker.css({
            left: (x + initialLeftOffset) + 'px'
        });

        this.trigger('drag', this.getValue());
        return false;
    },

    /**
     * @param {jQuery.event} evt
     * @this {LetsMap.SliderView}
     */
    endDrag: function (evt) {
        this.trigger('endDrag', this.getValue());
        $(window).unbind('mousemove', this.drag);
        return false;
    },

    getRange: function () {
        return this.options.max - this.options.min;
    },

    /**
     * @return {Array} The current value of slider, as two-tuple (year, month)
     * @this {LetsMap.SliderView}
     */
    getValue: function () {
        var options = this.options,
            $marker = this.$marker,
            $el = this.$el;
        var width = $el.outerWidth() - $marker.outerWidth();
        var ratio = this.getRange() / width;
        var left = $marker.position().left - this.initialLeftOffset();
        var rawVal = options.min + (left * ratio);

        return [ Math.floor(rawVal / 12), Math.round(rawVal % 12) ];
    },

    /**
     * Set the value of the slider.
     * @param {number} year the year to set it to
     * @param {number} month the month to set it to
     * @this {LetsMap.SliderView}
     */
    setValue: function (year, month) {
        year = Number(year);
        month = Number(month);
        var asNum = Math.round((year + (month / 12)) * 12);
        if (asNum > this.options.max) {
            asNum = this.options.max;
        } else if (asNum < this.options.min) {
            asNum = this.options.min;
        }
        var width = this.$el.outerWidth() - this.$marker.outerWidth();
        var x = Math.round(width * ((asNum - this.options.min) /
                                    this.getRange()));

        this.$marker.css({
            left: x + 'px'
        });
        this.trigger('endDrag', this.getValue());
    },

    getIdx: function () {
        var curVal = this.getValue(),
            minYear = Math.floor(this.options.min / 12),
            minMonth = Math.round(this.options.min % 12);

        return (curVal[0] - minYear) * 12 + (curVal[1] - minMonth);
    }
});
