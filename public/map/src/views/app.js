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
/*globals Backbone, $, LetsMap, Mustache, _*/
"use strict";

// Ew, but closure compiler has special ideas about the meaning of 'bind'.
/**
 * @type{function(function(jQuery.event), Object): function(...[*])}
 */
_.myBind = function () { return _.bind.apply(this, arguments); };

/**
 * @param {Object} options
 * @constructor
 * @extends Backbone.View
 */
LetsMap.AppView = Backbone.View.extend({
    id: 'app',

    /**
     * @this {LetsMap.AppView}
     */
    initialize: function (options) {
        /** @type {LetsMap.MapView} */
        this.map = new LetsMap.MapView({});
        this.map.$el.appendTo(this.$el);
        this.infoBox = new LetsMap.InfoBoxView({});
        this.infoBox.$el.appendTo(this.$el);
        this.about = new LetsMap.AboutView({});
        this.about.$el.appendTo(this.$el);
    },

    /**
     * @this {LetsMap.AppView}
     */
    render: function () {
        this.map.render();
        //this.infoBox.render();
        //this.about.render();
        return this;
    }
});

