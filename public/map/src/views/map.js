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

        var $progressBar = this.$progressBar = $('<div />')
            .progressbar()
            .attr('id', 'progressbar')
            .appendTo(this.$el);

        this.$progressBarText = $('<div />')
            .attr('id', 'progressbar-text')
            .appendTo($progressBar);

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
                    latlng: cluster._latlng
                });
            }
        }).on('addinglayers', _.bind(function (data) {
            this.showProgress('Generating heatmap', data.added, data.total);
        }, this)).on('addedlayers', _.bind(function () {
            this.hideProgress();
            this._revalidateVisibleMarkers();
            this._redrawVisibleMarkers(this._slider.getValue().idx, false);
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
        var $xhr = $.getJSON('../../data/all_accidents.json', _.bind(function (data) {
            //data = data.slice(0, 3000);
            var before = new Date(),
                dataLen = data.length,
                added = 0,
                i,
                step = 500,
                createMarkers = _.bind(function (data, start) {
                    this._markers.addLayers(_.map(data.slice(start, start + step), function (v) {
                        return new LetsMap.Marker(v);
                    }));
                    added += step;
                    if (added % 5000 === 0) {
                        this.showProgress("Processing data", added, dataLen);
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
        var loadInterval = setInterval(_.bind(function () {
            var contentLength = $xhr.getResponseHeader('Content-Length'),
                respLength;
            if (contentLength) {
                contentLength = Number(contentLength);
                respLength = $xhr.responseText.length;
                this.showProgress('Loading data',
                                  Math.round($xhr.responseText.length / 1000),
                                  Math.round(contentLength / 1000));
                if (respLength >= contentLength) {
                    clearInterval(loadInterval);
                }
            } else {
                this.showProgress('Waiting for server to start sending data');
            }
        }, this), 300);
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
        if (num && denom) {
            this.$progressBar.show().progressbar('value', (num / denom) * 100);
            this.$progressBarText.text(text + ' (' + num + '/' + denom + ')');
            //console.log(text, ": ", num, "/", denom);
        } else {
            this.$progressBar.show().progressbar('value', false);
            this.$progressBarText.text(text);
            //console.log(text);
        }
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
    _redrawVisibleMarkers: function (idx, force) {
        var zoom = this._map.getZoom(),
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

            if (data.lastValue === idx && !force) {
                return;
            }
            d = data.data[idx];
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
            data.lastValue = idx;
        });
    },

    /**
     * @this {LetsMap.AppView}
     */
    render: function (newYear, newMonth, newZoom, lat, lng) {
        // initial setup
        var attribution = 'Map data &copy; OpenStreetMap contributors';
        //newZoom = newZoom > maxZoom ? maxZoom : newZoom;
        //newZoom = newZoom < minZoom ? minZoom : newZoom;
        if (!this._map) {
            var popupTemplate = $('#markerTemplate').html();
            var map = this._map = new L.Map(this.MAP_HOLDER_ID, {
                center: new L.LatLng(lat, lng),
                zoom: newZoom,
                minZoom: 10,
                maxZoom: 17,
                zoomAnimation: false,
                markerZoomAnimation: false,
                zoomControl: false // added later
            });

            var baseLayers = {
                "Standard": new L.TileLayer('http://otile2.mqcdn.com/tiles/1.0.0/osm/{z}/{x}/{y}.png', {
                    attribution: attribution
                }),
                "Cycle": new L.TileLayer('http://b.tile.opencyclemap.org/cycle/{z}/{x}/{y}.png', {
                    attribution: attribution
                }),
                "Transit": new L.TileLayer('http://b.tile2.opencyclemap.org/transport/{z}/{x}/{y}.png', {
                    attribution: attribution
                })
            };

            map.addLayer(baseLayers.Standard);
            new L.Control.Layers(baseLayers, [], {position: "topleft"}).addTo(this._map);
            new L.Control.Zoom({position: "topleft"}).addTo(this._map);
            var slider = this._slider = new LetsMap.Slider({position: "bottomleft"}).addTo(this._map);

            var dimensionControl = this._dimensionControl = new LetsMap.DimensionControl({
                position: 'topright'
            }).addTo(this._map);

            this._map.on('slide', _.bind(function (e) {
                var zoom = this._map.getZoom(),
                    lat = this._map.getCenter().lat,
                    lng = this._map.getCenter().lng;
                this.trigger('changeview', e.year, e.month, zoom, lat, lng);
                var popup = this._curPopup;
                if (popup) {
                    popup.setContent(Mustache.render(popupTemplate, {
                        data: popup.options.data[e.idx],
                        streetName: popup.options.streetName,
                        count: popup.options.count,
                        aggregate: popup.options.aggregate
                    }));
                }
                this._redrawVisibleMarkers(e.idx, false);
            }, this));

            // pass Leaflet events through to backbone
            this._map.on('dragend zoomend', function (e) {
                var sliderValue = slider.getValue(),
                    zoom = this._map.getZoom(),
                    lat = this._map.getCenter().lat,
                    lng = this._map.getCenter().lng;
                this.trigger('changeview', sliderValue.year, sliderValue.month, zoom, lat, lng);
                this._revalidateVisibleMarkers();
                this._redrawVisibleMarkers(sliderValue.idx, false);
            }, this);

            this._map.on('popupopen', _.bind(function (e) {
                var popup = this._curPopup = e.popup;
                popup.setContent(
                    Mustache.render(popupTemplate, _.extend({}, popup.options, {
                        data: popup.options.data[slider.getValue().idx],
                    }))
                );
            }, this));
            this._map.on('popupclose', _.bind(function (e) {
                this._curPopup = null;
            }, this));
            this._map.on('dimensionchange', _.bind(function (e) {
                this._redrawVisibleMarkers(slider.getValue().idx, true);
            }, this));

            this._loadMarkers();
        }

        if (newYear && newMonth) {
            this._slider.setValue(newYear, newMonth);
        }
        this._map.setZoom(newZoom);
        this._map.panTo(new L.LatLng(lat, lng));

        return this;
    }
});
