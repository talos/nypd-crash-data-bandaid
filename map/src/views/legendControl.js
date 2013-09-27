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
        var div = L.DomUtil.create('div', 'legend-control leaflet-bar'),
            bubbles = this._bubbles = [],
            i;
        div.innerHTML = $('#legendControlTemplate').html();

        for (i = 0; i < this.options.bubbles; i += 1) {
            bubbles.push(this._bubble(i / this.options.bubbles));
        }

        _.each(bubbles, function ($b) {
            $(div).append($b);
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
        if (volume) {
            this.$volume.slider('value', volume);
            this.volume = volume;
        }
        volume = volume || this.volume;
        _.each(this._bubbles, function ($b) {
            var intensity = $b.data('crashmapper-legend-bubble-intensity') * 2.5,
                n = intensity,
                color = gradient(n),
                darkColor = gradient(2 / n),
                width = 10,
                $text = $('.legend-bubble-text', $b);
            $b.css({
                'box-shadow': '0px 0px ' + Math.round(width) + 'px ' +
                    Math.round(width * 3 / 4) + 'px' + ' ' + color,
                'background-color': color,
                'border': '1px solid ' + darkColor,
                'color': (n > 2 / n) ? color : darkColor,
            });
            $text.text((intensity / volume).toFixed(2));
        });
    },

    /**
     * Generate a legend bubble with this intensity.
     */
    _bubble: function (intensity) {
        var $bubble = $('<div />').addClass('legend-bubble');
        $bubble.data('crashmapper-legend-bubble-intensity', intensity);
        $bubble.append($('<div />').addClass('legend-bubble-text'));
        return $bubble;
    }
});
