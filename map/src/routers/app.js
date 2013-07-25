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
/*globals Backbone, $, LetsMap, Mustache, _, L*/
"use strict";

LetsMap.AppRouter = Backbone.Router.extend({
    initialize: function (options) {
        this.view = options.view;

        this.view.map.on('changeview', function (year, month, base, dimension,
                                                 volume, zoom, lat, lng) {
            this.navigate([year, month + 1, base.toLowerCase(),
                          dimension.toLowerCase(), volume, zoom,
                          lat.toPrecision(5), lng.toPrecision(5)].join('/'));
        }, this);
    },

    routes: {
        'about': 'about',
        ':year/:month/:base/:dimension/:volume/:zoom/:lat/:lng': 'map',
        '*notFound': 'notFound',
    },

    map: function (year, month, base, dimension, volume, zoom, lat, lng) {
        this.view.map.render(year, month - 1, base, dimension, volume, zoom, lat, lng);
    },

    notFound: function () {
        this.navigate('about', {trigger: true});
    },

    about: function () {
        this.view.about.$el.show();
        this.view.map.render(); // pre-load map
    }
});
