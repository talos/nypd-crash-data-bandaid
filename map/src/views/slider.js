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
            $slider,
            helpText = 'Drag my handles to change start and end date!';
        div.innerHTML = $('#sliderTemplate').html();
        this.$slider = $('#slider', div).slider({
            max: this.options.max,
            min: this.options.min,
            range: true,
            step: true,
            dragging: true,
            values: (this.options.start && this.options.end) ?
                    [this.options.start, this.options.end] :
                    [this.options.min, this.options.max],
            animate: false
        }).on('slide', function (evt, ui) {
            var $slider = $(evt.target),
                oldValues,
                dragVal,
                priorDragVal,
                dragDiff;

            // Handle a drag on the slider
            if ($slider.data('slider-dragging') === true) {
                $slider.children('.ui-slider-handle').removeClass('ui-state-active ui-state-focus').blur();

                oldValues = $slider.slider('values');
                priorDragVal = $slider.data('slider-dragging-val');

                // Figure out the dragged value
                if (oldValues[0] !== ui.values[0]) {
                    dragVal = ui.values[0];
                } else if (oldValues[1] !== ui.values[1]) {
                    dragVal = ui.values[1];
                }

                // If this is a continued drag (rather than the first instance)
                // possibly manipulate the slider.
                if (typeof priorDragVal !== 'undefined' && priorDragVal !== dragVal) {
                    dragDiff = dragVal - priorDragVal;

                    // Only manipulate the slider if this won't violate limits
                    // (which would change the sliding time)
                    if (oldValues[0] + dragDiff >= $slider.slider('option', 'min') &&
                            oldValues[1] + dragDiff <= $slider.slider('option', 'max')) {
                        $slider.slider('values', 0, oldValues[0] + dragDiff);
                        $slider.slider('values', 1, oldValues[1] + dragDiff);

                        map.fire('slide', {
                            start: self.getValue(oldValues[0] + dragDiff),
                            end: self.getValue(oldValues[1] + dragDiff)
                        });
                        self._updateCurrentDiv(oldValues[0] + dragDiff,
                                               oldValues[1] + dragDiff);
                    }
                }

                // Store the dragged value for later.
                $slider.data('slider-dragging-val', dragVal);

                // Suppress normal operation of the slider.
                return false;
            } else {
                $slider.data('slider-dragging-val', undefined);
                map.fire('slide', {
                    start: self.getValue(ui.values[0]),
                    end: self.getValue(ui.values[1])
                });
                self._updateCurrentDiv(ui.values[0], ui.values[1]);
            }
        }).on('slidestart', function (evt, ui) {
            map.dragging.disable();
            var $slider = $(evt.target),
                $origTarget = $(evt.originalEvent.target);
            // This is a slide on the range, suppress it.
            if ($origTarget.hasClass('ui-slider-range')) {
                $slider.data('slider-dragging', true);
                $slider.data('slider-dragging-val', undefined);
                $origTarget.addClass('ui-state-active ui-state-focus');
            }
        }).on('slidestop', function (evt) {
            map.dragging.enable();
            var $slider = $(evt.target),
                $range = $slider.children('.ui-slider-range');
            $slider.data('slider-dragging', false);
            $slider.data('slider-dragging-val', undefined);
            $range.removeClass('ui-state-active ui-state-focus');
        });
        this.$slider.children('.ui-slider-range').on('mouseenter', function () {
            $(this).addClass('ui-state-hover');
        }).on('mouseleave', function () {
            $(this).removeClass('ui-state-hover');
        });
        $('a.ui-slider-handle', this.$slider).attr({
            alt: helpText,
            title: helpText
        });
        $('#slider-min', div).html(this._prettyValue(this.options.min));
        $('#slider-max', div).html(this._prettyValue(this.options.max));
        this.$currentStartDiv = $('#slider-current .start-time', div);
        this.$currentEndDiv = $('#slider-current .end-time', div);
        this._updateCurrentDiv(this.$slider.slider('values', 0),
                               this.$slider.slider('values', 1));
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
