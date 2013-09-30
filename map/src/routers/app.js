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
/*globals Backbone, Crashmapper, ga, _*/

Crashmapper.AppRouter = Backbone.Router.extend({

    initialize: function (options) {
        this.view = options.view;

        // Keep URL in sync with map.
        this.view.map.on('changeview', function (startYear, startMonth,
                                                 endYear, endMonth, base,
                                                 dimension, volume, zoom, lat,
                                                 lng) {
            this.navigate([Number(startYear) - 2000, Number(startMonth) + 1,
                          Number(endYear) - 2000, Number(endMonth) + 1,
                          base.toLowerCase(),
                          dimension.toLowerCase(), volume, zoom,
                          lat.toPrecision(5), lng.toPrecision(5)].join('/'));
        }, this);
    },

    routes: {
        '': 'root',
        'about': 'about',
        ':year/:month/:base/:dimension/:volume/:zoom/:lat/:lng': 'legacyMap',
        ':startYear/:startMonth/:endYear/:endMonth/:base/:dimension/:volume/:zoom/:lat/:lng':
            'map',
        '*notFound': 'notFound'
    },

    /**
     * Override navigate to trigger GA.
     */
    navigate: function () {
        var retval = Backbone.Router.prototype.navigate.apply(this, arguments);
        try {
            ga('send', 'pageview');
        } catch (err) { // In case GA wasn't loaded yet.
        }
        return retval;
    },

    /**
     * Reroute pre-multi handle slider to multi-handle slider.
     */
    legacyMap: function (year, month, base, dimension, volume, zoom, lat, lng) {
        this.navigate([Number(year) - 2000, month, Number(year) - 2000, month,
                      base, dimension, volume, zoom, lat, lng].join('/'),
                      {trigger: true});
    },

    map: function (startYear, startMonth, endYear, endMonth, base, dimension,
                   volume, zoom, lat, lng) {
        this.view.map.render(Number(startYear) + 2000, Number(startMonth) - 1,
                             Number(endYear) + 2000, Number(endMonth) - 1,
                             base, dimension, volume, zoom, lat, lng);
    },

    notFound: function () {
        this.navigate('about', {trigger: true});
    },

    about: function () {
        // pre-load map
        if (!this.view.map._map) {
            this.view.map.render();
        }
        this.view.about.display();
    },

    root: function () {
        if (!this.view.map._map) {
            this.navigate('about', {trigger: true});
        } else {
            this.view.map.triggerViewChange();
        }
    }
});
