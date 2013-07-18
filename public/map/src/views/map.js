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

        this._base = new L.TileLayer('http://otile2.mqcdn.com/tiles/1.0.0/osm/{z}/{x}/{y}.png', {
            minZoom: 8,
            maxZoom: 17,
            attribution: 'Map data © OpenStreetMap contributors'
        });

        var $slider = this.$slider = $('<div />')
            .attr('id', 'slider')
            .appendTo(this.$el);

        var $progressBar = this.$progressBar = $('<div />')
            .progressbar()
            .attr('id', 'progressbar')
            .appendTo(this.$el);

        var $title = this.$title = $('<div />')
            .attr('id', 'title')
            .appendTo(this.$el);

        /** @type {L.MarkerClusterGroup} */
        this._markers = L.markerClusterGroup({
            disableClusteringAtZoom: 16,
            showCoverageOnHover: false,
            maxClusterRadius: 30,
            zoomToBoundsOnClick: false,
            animateAddingMarkers: false,
            zoomAnimation: false,
            iconCreateFunction: function (cluster) {
                // Aggregate data for cluster once and memo it
                if (!cluster._data) {
                    var markers = cluster.getAllChildMarkers();
                    cluster._data = LetsMap.Marker.prototype._aggregateData(markers);
                    cluster._markerCount = markers.length;
                    cluster._streetName = markers[0].options.icon.options.streetName;
                }
                return new LetsMap.Icon({
                    marker: cluster,
                    data: cluster._data,
                    streetName: cluster._streetName,
                    aggregate: true,
                    count: cluster._markerCount,
                    latlng: cluster._latlng,
                    $slider: $slider
                });
            }
        }).on('addinglayers', _.bind(function (data) {
            this.showProgress('Adding layers', data.added, data.total);
        }, this)).on('addedlayers', _.bind(function () {
            this.hideProgress();
            this._revalidateVisibleMarkers();
            var minSlider = 7; // TODO fix this when slider is refactored into its own control
            this._redrawVisibleMarkers(this.$slider.slider('value'), false, minSlider);
        }, this));

        this.$mapHolder = $('<div />')
            .attr({'id': this.MAP_HOLDER_ID})
            .appendTo(this.$el);

        this._map = null;

        this.$progressDiv = $('<div />').attr('id', 'progress')
            .hide()
            .appendTo(this.$el);
    },

    /**
     * Load markers via XHR.
     *
     * @this {LetsMap.AppView}
     */
    _loadMarkers: function () {
        var $slider = this.$slider;
        $.getJSON('../../data/all_accidents.json', _.bind(function (data) {
            //data = data.slice(0, 3000);
            var before = new Date(),
                dataLen = data.length,
                added = 0,
                i,
                step = 500,
                createMarkers = _.bind(function (data, start) {
                    this._markers.addLayers(_.map(data.slice(start, start + step), function (v) {
                        return new LetsMap.Marker(v, $slider);
                    }));
                    added += step;
                    if (added % 5000 === 0) {
                        this.showProgress("Added markers", added, dataLen);
                    }
                    if (added >= dataLen) {
                        var before = new Date();
                        this._map.addLayer(this._markers);
                    } else {
                        // continue deferred loop
                        _.defer(createMarkers, data, start + step);
                    }
                }, this);
            createMarkers(data, 0);
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
        this.$progressBar.show().progressbar('value', (num / denom) * 100);
        console.log(text, ": ", num, "/", denom);
    },

    /**
     * Hide the progress indicator.
     *
     * @this {LetsMap.AppView}
     */
    hideProgress: function () {
        this.$progressBar.fadeOut().progressbar('disable');
    },

    /**
     * Update the markers that are visible.
     */
    _revalidateVisibleMarkers: function () {
        var height = $(window).height(),
            width = $(window).width(),
            self = this;
        this._visibleMarkers = [];
        $('.intersection-marker').each(function (i, m) {
            var $m = $(m),
                pos = $m.offset();
            if (pos.left > 0 && pos.top > 0 && pos.left < width && pos.top < height) {
                self._visibleMarkers.push([$m.children(), $m.data('letsmap')]);
            }
        });
    },

    _gradient: function (n) {
        // 0: #bfc  rgb(187, 255, 204)
        // 1: #fc9  rgb(255, 204, 153)
        // 2: #f60  rgb(255, 102, 0)
        var r, g, b;
        if (n <= 1) {
            n = n - 0.5;
            r = 187 * (0.5 - n) + 255 * (0.5 + n);
            g = 255 * (0.5 - n) + 204 * (0.5 + n);
            b = 204 * (0.5 - n) + 153 * (0.5 + n);
        } else if (n <= 2) {
            n = n - 1.5;
            r = 255 * (0.5 - n) + 255 * (0.5 + n);
            g = 204 * (0.5 - n) + 102 * (0.5 + n);
            b = 153 * (0.5 - n);
        } else {
            r = 255;
            g = 102;
            b = 0;
        }
        return "rgb(" + Math.floor(r) + "," + Math.floor(g) + "," + Math.floor(b) + ")";
    },

    /**
     * Redraw them.
     */
    _redrawVisibleMarkers: function (sliderValue, force, minSlider) {
        var $slider = this.$slider,
            //intensities = ['good', 'medium', 'bad'],
            //densities = ['single', 'several', 'many'],
            zoom = this._map.getZoom(),
            gradient = this._gradient,
            dimension = this._dimensionControl.getDimensionFunction();
        _.each(this._visibleMarkers, function (v) {
            var $m = v[0],
                data = v[1],
                intensity,
                density,
                cnt = data.count,
                width,
                color,
                d;

            if (data.lastValue === sliderValue && !force) {
                return;
            }
            d = data.data[sliderValue - minSlider];
            // zoom 16: single intersections only           0 1
            // zoom 15: 1 - 5 intersections, avg 3          1 3
            // zoom 14: 3 - 20 intersections, avg 10        2 9
            // zoom 13: 10 - 70 intersections, avg 50       3 27
            // zoom 12: 20 - 200 intersections, avg 100     4 81
            // zoom 11: 50 - 600 intesrsections, avg 250    5 243
            // zoom 10: 150 - 2000 intersections, avg 800   6 729
            // zoom 9:  300 - 5000 intersections, avg 2500  7 2187

            width = 20 * cnt / Math.pow(3, (16 - zoom));

            if (d) {
                color = gradient(dimension(d, cnt));
            } else {
                color = gradient(0);
            }
            if (cnt > 1) {
                $m.css({
                    'box-shadow': '0px 0px ' + Math.round(width) + 'px ' +
                        Math.round(width * 3 / 4) + 'px' + ' ' + color,
                    'background-color': color
                });
            } else {
                $m.css({
                    'background-color': color
                });
            }
            data.lastValue = sliderValue;
        });
    },

    /**
     * @this {LetsMap.AppView}
     */
    render: function (year, month, newZoom, lat, lng) {
        // initial setup
        var newSliderValue = ((year - 2011) * 12) + month,
            maxSlider = 28,
            minSlider = 7,
            minZoom = 10,
            maxZoom = 17,
            months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'June', 'July', 'Aug',
                'Sep', 'Oct', 'Nov', 'Dec'];
        if (year && month) {
            newSliderValue = newSliderValue > maxSlider ? maxSlider : newSliderValue;
            newSliderValue = newSliderValue < minSlider ? minSlider : newSliderValue;
        } else {
            newSliderValue = maxSlider;
            year = Math.round(newSliderValue / 12) + 2011;
            month = newSliderValue % 12;
        }
        newZoom = newZoom > maxZoom ? maxZoom : newZoom;
        newZoom = newZoom < minZoom ? minZoom : newZoom;
        if (!this._map) {
            this.$slider.slider({
                max: maxSlider,
                min: minSlider,
                value: newSliderValue,
                animate: true
            });
            this.$title.text(months[month] + ' ' + year);
            var popupTemplate = $('#markerTemplate').html();
            this._map = new L.Map(this.MAP_HOLDER_ID, {
                center: new L.LatLng(lat, lng),
                zoom: newZoom,
                minZoom: 9,
                maxZoom: 17,
                zoomAnimation: false,
                markerZoomAnimation: false
            });
            this._map.addLayer(this._base);

            var dimensionControl = this._dimensionControl = new LetsMap.DimensionControl({
                position: 'topright'
            }).addTo(this._map);

            this.$slider.on('slide', _.bind(function (evt, ui) {
                var sliderValue = ui.value,
                    year = Math.floor(sliderValue / 12) + 2011,
                    month = sliderValue % 12,
                    zoom = this._map.getZoom(),
                    lat = this._map.getCenter().lat,
                    lng = this._map.getCenter().lng;
                this.trigger('changeview', year, month, zoom, lat, lng);
                this.$title.text(months[month] + ' ' + year);
                var popup = this._curPopup;
                if (popup) {
                    popup.setContent(Mustache.render(popupTemplate, {
                        data: popup.options.data[ui.value - minSlider],
                        streetName: popup.options.streetName,
                        count: popup.options.count,
                        aggregate: popup.options.aggregate
                    }));
                }
                this._redrawVisibleMarkers(sliderValue, false, minSlider);
            }, this));

            // pass Leaflet events through to backbone
            this._map.on('dragend', function (e) {
                var sliderValue = this.$slider.slider('value'),
                    year = Math.floor(sliderValue / 12) + 2011,
                    month = sliderValue % 12,
                    zoom = this._map.getZoom(),
                    lat = this._map.getCenter().lat,
                    lng = this._map.getCenter().lng;
                this.trigger('changeview', year, month, zoom, lat, lng);
                this._revalidateVisibleMarkers();
                this._redrawVisibleMarkers(sliderValue, false, minSlider);
            }, this);
            this._map.on('zoomend', function (e) {
                var sliderValue = this.$slider.slider('value'),
                    year = Math.floor(sliderValue / 12) + 2011,
                    month = sliderValue % 12,
                    zoom = this._map.getZoom(),
                    lat = this._map.getCenter().lat,
                    lng = this._map.getCenter().lng;
                this.trigger('changeview', year, month, zoom, lat, lng);
                this._revalidateVisibleMarkers();
                this._redrawVisibleMarkers(sliderValue, false, minSlider);
            }, this);

            this._map.on('popupopen', _.bind(function (e) {
                var popup = this._curPopup = e.popup;
                var popupOptions = popup.options;
                var sliderValue = this.$slider.slider('value');
                popup.setContent(Mustache.render(popupTemplate, {
                    data: popupOptions.data[sliderValue - minSlider],
                    streetName: popupOptions.streetName,
                    count: popupOptions.count,
                    aggregate: popupOptions.aggregate
                }));
            }, this));
            this._map.on('popupclose', _.bind(function (e) {
                this._curPopup = null;
            }, this));
            this._map.on('dimensionchange', _.bind(function (e) {
                var sliderValue = this.$slider.slider('value');
                this._redrawVisibleMarkers(sliderValue, true, minSlider);
            }, this));

            this._loadMarkers();
        }

        //this.$slider.slider("value", ((year - 2011) * 12) + month);
        this._map.setZoom(newZoom);
        this._map.panTo(new L.LatLng(lat, lng));

        return this;
    }
});
