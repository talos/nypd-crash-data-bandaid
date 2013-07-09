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

/*jslint browser: true, nomen: true, sub: true, vars: true*/
/*globals Backbone, $, LetsMap, Mustache, L, _, HeatCanvas, STATIC_HOST*/
"use strict";

/**
 * Default base layer.
 * @define {string}
 */
var LETS_MAP_BASE_LAYER_DEFAULT = 'toner';

/**
 * @param {Object} options
 * @constructor
 * @extends Backbone.View
 */
LetsMap.MapView = Backbone.View.extend({
    id: 'map',
    /**
     * @this {LetsMap.AppView}
     */
    initialize: function (options) {
        /** @type {string} */
        this.MAP_HOLDER_ID = 'mapHolder';

        /** @type {L.StamenTileLayer} */
        this._base = new L.StamenTileLayer(LETS_MAP_BASE_LAYER_DEFAULT);

        /** @type {LetsMap.SliderView} */
        var slider = this.slider = new LetsMap.SliderView();
        this.slider.$el.appendTo(this.$el);
        this.slider.on('drag', _.myBind(this.render, this));
        this.slider.on('endDrag', _.myBind(this.render, this));
        this.lastSliderIdx = null;

        /** @type {L.MarkerClusterGroup} */
        var stopped = false;
        this._markers = L.markerClusterGroup({
            disableClusteringAtZoom: 17,
            showCoverageOnHover: false,
            maxClusterRadius: 40,
            iconCreateFunction: function (cluster) {
                var cnts = _.reduce(cluster.getAllChildMarkers(), function (memo, m) {
                    _.each(m.getWeight(), function (d, i) {
                        if (!memo[i]) {
                            memo[i] = 0;
                        }
                        memo[i] += d;
                    });
                    return memo;
                }, []),
                    spans = "";
                _.each(cnts, function (c, i) {
                    spans += '<span style="display:none;" class="time' +
                        i + '">' + c + '</span>';
                });

                return new L.DivIcon({
                    html: '<div class="marker-cluster-small">' + spans + '</div>',
                    iconSize: new L.Point(40, 40)
                });
            }
        });

        /** @type {jQueryObject} **/
        this.$mapHolder = $('<div />')
            .attr({'id': this.MAP_HOLDER_ID})
            .appendTo(this.$el);

        /** @type {?L.Map} **/
        this._map = null;

        /** @type {L.LayerGroup} */
        this._venueGroup = new L.LayerGroup();

        /** @type {Array.<LetsMap.Marker>} */
        //this.markers = [];

        /** @type {function()} */
        this.loadMarkers = this.loadMarkers || undefined;
        this.loadMarkers();

        this.$progressDiv = $('<div />').attr('id', 'progress')
            .hide()
            .appendTo(this.$el);
    },

    /**
     * Load markers via XHR.
     *
     * @this {LetsMap.AppView}
     */
    loadMarkers: function () {
        $.getJSON('../../data/all_accidents.json', _.bind(function (data) {
            var before = new Date(),
                dataLen = data.length,
                markers = [],
                finishUp = _.bind(function () {
                    before = new Date();
                    this._markers.addLayers(markers, _.bind(function () {
                        this.hideProgress();
                    }, this), _.bind(function (added, total) {
                        if (added % 3000 === 0) {
                            this.showProgress("Preparing markers", added, total);
                        }
                    }, this));
                }, this),
                createMarker = _.bind(function (v) {
                    markers.push(new LetsMap.Marker(v, this.slider));
                    var markersLen = markers.length;
                    if (markersLen % 3000 === 0) {
                        this.showProgress("Creating markers", markersLen, dataLen);
                    }
                    if (markersLen === dataLen) {
                        finishUp();
                    }
                }, this);
            _.each(data, function (v) {
                _.defer(createMarker, v);
            });
        }, this));
    },

    /**
     * Show load progress with specified text
     *
     * @param {string} text Text to show.
     * @param {number} num Numerator of fraction to draw.
     * @param {number} denom Denominator of fraction to draw.
     *
     * @this {LetsMap.AppView}
     */
    showProgress: function (text, num, denom) {
        this.$progressDiv.show().text(text + ": " + num + "/" + denom);
        console.log(text, ": ", num, "/", denom);
    },

    /**
     * Hide the progress indicator.
     *
     * @this {LetsMap.AppView}
     */
    hideProgress: function () {
        this.$progressDiv.fadeOut();
    },

    /**
     * Get the current view -- an object with zoom, lat, and lng.
     * @this {LetsMap.AppView}
     */
    getView: function () {
        if (!this._map) {
            throw new Error('Map has not yet been rendered.');
        }
        var center = this._map.getCenter(),
            sliderValue = this.slider.getValue();
        return {
            year: sliderValue[0],
            month: sliderValue[1],
            zoom: this._map.getZoom(),
            lat: center.lat,
            lng: center.lng
        };
    },

    /**
     * @this {LetsMap.AppView}
     */
    render: function () {
        var sliderIdx = this.slider.getIdx();

        this.slider.render();

        // initial setup
        if (!this._map) {
            this._map = new L.Map(this.MAP_HOLDER_ID, {
                center: new L.LatLng(40.70432661161239, -73.87447357177733),
                zoom: 9,
                minZoom: 9,
                maxZoom: 17
            });
            this._map.addLayer(this._base);
            this._map.addLayer(this._markers);

            // pass Leaflet events through to backbone
            this._map.on('moveend', function (e) {
                this.trigger('changeview');
            }, this);
            this.slider.on('endDrag', function (e) {
                this.trigger('changeview');
            }, this);
            this._map.on('zoomend', function (e) {
                this.render();
            }, this);
        }

        if (sliderIdx !== this.lastSliderIdx) {
            $('.time' + this.lastSliderIdx).hide();
            this.lastSliderIdx = sliderIdx;
            $('.time' + sliderIdx).show();
        }

        return this;
    },

    /**
     * @param {number} year
     * @param {number} month
     * @param {number} zoom
     * @param {number} lat
     * @param {number} lng
     * @this {LetsMap.AppView}
     */
    goTo: function (year, month, zoom, lat, lng) {
        this.slider.setValue(year, month);
        this._map.setZoom(zoom);
        this._map.panTo(new L.LatLng(lat, lng));
    }
});
