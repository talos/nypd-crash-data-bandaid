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
/*globals $, Crashmapper, L */

/**
 * @constructor
 * @extends L.Control
 */
Crashmapper.HelpControl = L.Control.extend({
    options: {
        position: 'topleft'
    },

    onAdd: function () {
        var div = L.DomUtil.create('div', 'help-control leaflet-bar');
        div.innerHTML = $('#helpControlTemplate').html();
        $('a', div).click(function (evt) {
            evt.preventDefault();
            Crashmapper.router.navigate('about', {trigger: true});
            return false;
        });
        return div;
    }
});
