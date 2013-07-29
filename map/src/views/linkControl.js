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

/*jslint browser: true, nomen: true, regexp:true, sloppy: true*/
/*globals $, Crashmapper, L*/

/**
 * @constructor
 * @extends L.Control
 */
Crashmapper.LinkControl = L.Control.extend({
    options: {
        position: 'topleft'
    },

    onAdd: function (map) {
        var div = L.DomUtil.create('div', 'link-control leaflet-bar'),
            $linkPopup,
            $linkInput;
        div.innerHTML = $('#linkControlTemplate').html();
        $linkPopup = $('.link-popup', div);
        $linkInput = $('.link-input', $linkPopup);
        $linkPopup.hide();
        $('a#link-button', div).click(function (evt) {
            var href = window.location.href,
                $twitterButton = $('.twitter-share-button', div),
                twitterSrc = $twitterButton.attr('src');
            evt.preventDefault();
            $('.fb-like', div).attr('data-href', href);
            twitterSrc = twitterSrc.replace(/url=[^&]*/, 'url=' + encodeURIComponent(href));
            $twitterButton.attr('src', twitterSrc);
            $linkPopup.toggle();
            if ($linkPopup.is(':visible')) {
                $linkInput.val(window.location.href).focus().select();
            }
            return false;
        });
        $linkInput.on('click', function () {
            $linkInput.focus().select();
        });
        map.on('moveend slide baselayerchange dimensionchange', function () {
            if ($linkPopup.is(':visible')) {
                $linkPopup.hide();
            }
        });
        return div;
    }
});
