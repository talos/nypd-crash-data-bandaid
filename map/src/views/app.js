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
/*globals Backbone, Crashmapper */

/**
 * @param {Object} options
 * @constructor
 * @extends Backbone.View
 */
Crashmapper.AppView = Backbone.View.extend({
    id: 'app',

    /**
     * @this {Crashmapper.AppView}
     */
    initialize: function () {
        this.about = new Crashmapper.AboutView({}).render();
        this.about.$el.appendTo(this.$el).hide();
        this.map = new Crashmapper.MapView({});
        this.map.$el.appendTo(this.$el);
    },

    /**
     * @this {Crashmapper.AppView}
     */
    render: function () {
        return this;
    }
});

