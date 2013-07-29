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

/*jslint browser: true, sloppy: true*/
/*globals Backbone, $*/

/**
 * Global Crashmapper reference.
 * @type {Object}
 */
var Crashmapper = {};

$(document).ready(function () {
    var v = new Crashmapper.AppView({}),
        r = new Crashmapper.AppRouter({view: v}),
        historyOpts = {};
    Crashmapper.router = r;
    v.$el.appendTo('body');
    v.render();

    // Enable push state for non-local deploy.
    if (window.location.host.search('localhost') === -1) {
        historyOpts.pushState = true;
    }
    Backbone.history.start(historyOpts);
});
