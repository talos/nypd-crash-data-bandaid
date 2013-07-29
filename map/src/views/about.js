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
/*globals Backbone, $, Crashmapper, Mustache, _*/

Crashmapper.AboutView = Backbone.View.extend({
    id: 'about',

    tmpl: $('#aboutTemplate'),

    /**
     * @this {Crashmapper.AboutView}
     */
    render: function () {
        $(window).on('keydown', _.bind(function (evt) {
            if (evt.keyCode === 13 || evt.keyCode === 27) {
                this.dismiss();
            }
        }, this));
        this.$el.html(Mustache.render(this.tmpl.html(), {}));
        $('#aboutDismiss', this.$el).click(_.bind(function (evt) {
            evt.preventDefault();
            this.dismiss();
            return false;
        }, this));
        this.$el.click(_.bind(function (evt) {
            if (evt.target === this.$el[0]) {
                this.dismiss();
            }
        }, this));
        return this;
    },

    display: function () {
        this.$el.fadeIn();
        $('.help').fadeIn();
    },

    dismiss: function () {
        this.$el.fadeOut();
        $('.help').fadeOut();
        Crashmapper.router.navigate('', {trigger: true});
    }
});
