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
Crashmapper.LegendControl = L.Control.extend({
    options: {
        position: 'topright',
        volume: 2,
        bubbles: 5
    },

    onAdd: function (map) {
        var div = L.DomUtil.create('div', 'legend-control'),
            bubbles = this._bubbles = [],
            $toggle,
            self = this,
            i;
        div.innerHTML = $('#legendControlTemplate').html();

        for (i = 0; i < this.options.bubbles; i += 1) {
            bubbles.push(this._bubble(i / this.options.bubbles));
        }

        _.each(bubbles, function ($b) {
            $('#legend-control-bubbles', div).append($b);
        });

        this.volume = this.options.volume;
        this.$title = $('#legend-control-title', div);
        this.$volume = $('#legend-control-volume', div).slider({
            max: 40,
            min: 1,
            value: this.options.volume,
            orientation: 'vertical'
        }).on('slide', _.bind(function (evt, ui) {
            var value = ui.value;
            this.volume = value;
            map.fire('volumechange', {volume: value});
        }, this)).on('slidestart', function (evt, ui) {
            map.dragging.disable();
        }).on('slidestop', function (evt) {
            map.dragging.enable();
        }).on('click', function (evt) {
            // If user tries to use slider when locked, unlock it for them.
            if (self.$volume.slider('option', 'disabled')) {
                self.$toggle.trigger('click');
            }
        });
        this.$toggle = $('#legend-control-toggle', div).on('click', function (evt) {
            evt.preventDefault();
            evt.stopPropagation();
            if (self.isLocked()) {
                self.$volume.slider('enable');
                $(this).removeClass('ui-icon-locked');
                $(this).addClass('ui-icon-unlocked');
            } else {
                self.$volume.slider('disable');
                $(this).addClass('ui-icon-locked');
                $(this).removeClass('ui-icon-unlocked');
            }
            return false;
        });

        return div;
    },

    /**
     * Update the legend using the gradient to find colors, and volume to
     * draw a proper legend.  Optional title update.
     *
     * All bubbles are drawn for colors per intersection per month.
     */
    update: function (gradient, volume, title) {
        if (title) {
            this.$title.text(title);
        }

        // Don't allow overwrite of slider when it's locked.
        if (volume && !this.isLocked()) {
            this.$volume.slider('value', volume);
            this.volume = volume;
        } else {
            volume = this.volume;
        }
        _.each(this._bubbles, _.bind(function ($b) {
            var intensity = $b.data('crashmapper-legend-bubble-intensity') * 2.5,
                n = intensity,
                color = gradient(n),
                darkColor = gradient(2 / n),
                width = 10,
                fraction = this._reduce(intensity, volume),
                fractionText,
                $text = $('.legend-bubble-text', $b);
            $b.css({
                'box-shadow': '0px 0px ' + Math.round(width) + 'px ' +
                    Math.round(width * 3 / 4) + 'px' + ' ' + color,
                'background-color': color,
                'border': '1px solid ' + darkColor,
                'color': (n > 2 / n) ? color : darkColor,
            });

            if (fraction[0] === 0) {
                fractionText = '0';
            } else if (fraction[1] === 1) {
                fractionText = fraction[0];
            } else if (volume > 10) {
                fractionText = (intensity / volume).toFixed(2);
            } else {
                fractionText = fraction[0] + '/' + fraction[1];
            }

            $text.text(fractionText);
        }, this));
    },

    /**
     * Returns true if the legend control slider is current locked, false
     * otherwise.
     */
    isLocked: function () {
        return this.$volume.slider('option', 'disabled');
    },

    /**
     * Generate a legend bubble with this intensity.
     */
    _bubble: function (intensity) {
        var $bubble = $('<div />').addClass('legend-bubble');
        $bubble.data('crashmapper-legend-bubble-intensity', intensity);
        $bubble.append($('<div />').addClass('legend-bubble-text'));
        return $bubble;
    },

    /**
     * Reduce a fraction by finding the Greatest Common Divisor and dividing by it.
     *
     * From http://stackoverflow.com/a/4652513
     */
    _reduce: function (numerator, denominator) {
        var gcd = function gcd(a, b) {
            return b ? gcd(b, a % b) : a;
        };
        gcd = gcd(numerator, denominator);
        return [numerator / gcd, denominator / gcd];
    }
});
