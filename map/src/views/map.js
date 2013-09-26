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

/*jslint browser: true, nomen: true, sub: true, vars: true, sloppy: true*/
/*globals Backbone, $, Crashmapper, Mustache, L, _ */

/**
 * @param {Object} options
 * @constructor
 * @extends Backbone.View
 */
Crashmapper.MapView = Backbone.View.extend({
    id: 'map',
    /**
     * @this {Crashmapper.AppView}
     */
    initialize: function () {
        this.MAP_HOLDER_ID = 'mapHolder';
        this._ready = false;
        this.on('ready', _.bind(function () {
            this._ready = true;
        }, this));

        var $progressBar = this.$progressBar = $('<div />')
            .progressbar()
            .attr('id', 'progressbar')
            .addClass('leaflet-bar')
            .appendTo(this.$el);

        this.$progressBarText = $('<div />')
            .attr('id', 'progressbar-text')
            .appendTo($progressBar);

        this._markers = L.markerClusterGroup({
            disableClusteringAtZoom: 16,
            showCoverageOnHover: false,
            fps: 24,
            maxClusterRadius: 30,
            zoomToBoundsOnClick: false,
            animateAddingMarkers: false,
            zoomAnimation: false,
            iconCreateFunction: this._iconCreateFunction
        }).on('addinglayers', _.bind(function (data) {
            this.showProgress('Generating heatmap', data.added, data.total);
        }, this)).on('addedlayers', _.bind(function () {
            this.hideProgress();
            this._revalidateVisibleMarkers();
            var sliderVals = this._slider.getValues();
            this._redrawVisibleMarkers(sliderVals[0].idx, sliderVals[1].idx, false);
        }, this));

        this.$mapHolder = $('<div />')
            .attr({'id': this.MAP_HOLDER_ID})
            .appendTo(this.$el);

        this._map = null;

        this.$progressDiv = $('<div />').attr('id', 'progress')
            .hide()
            .appendTo(this.$el);
    },

    _iconCreateFunction: function (cluster) {
        // Aggregate data for cluster once and memo it
        if (!cluster._data) {
            var markers = cluster.getAllChildMarkers();
            cluster._data = Crashmapper.Marker.prototype._aggregateData(markers);
            cluster._markerCount = markers.length;
            cluster._streetName = markers[0].options.icon.options.streetName;
        }
        return new Crashmapper.Icon({
            marker: cluster,
            data: cluster._data,
            streetName: cluster._streetName,
            aggregate: true,
            count: cluster._markerCount,
            latlng: cluster._latlng
        });
    },

    /**
     * Add markers to to the map in a deferred loop, ensuring UI
     * responsiveness.
     *
     * @this {Crashmapper.AppView}
     */
    _createMarkers: function (data, i, dataLen, lastIdx) {
        var m,
            layers = [],
            start = new Date();

        lastIdx = lastIdx || 0; // Keep track of last idx of data

        while (i < dataLen) {
            m = new Crashmapper.Marker(data[i]);
            layers.push(m);
            if (lastIdx < m._data.length) {
                lastIdx = this._lastIdx = m._data.length;
            }

            // Only bother checking dates after 100 layers added
            if (i % 100 === 0) {
                // Ensure 20fps while loading
                if (new Date() - start > 100) {
                    break;
                }
            }
            i += 1;
        }
        this._markers.addLayers(layers);
        this.showProgress("Processing data", i, dataLen);
        if (i >= dataLen) {
            // Once data is all loaded, add layers and initialize the slider
            this._map.addLayer(this._markers);

            this._slider.options.max = 7 + lastIdx;
            this._slider.addTo(this._map);
            // Since the 'about' for the slider wouldn't be shown, we have to
            // do an after-the-fact check to see if "help" is currently
            // visible.  If so, it needs to be shown for the slider, too!
            // Since all help is visible when any help is visible, this `if`
            // statement works.
            // TODO: clean this up.
            if ($('.help').is(':visible')) {
                $('.help', this._slider.$el).fadeIn();
            }

            this.trigger('ready');
        } else {
            // continue deferred loop
            _.defer(_.bind(this._createMarkers, this), data, i, dataLen, lastIdx);
        }
    },

    /**
     * Load markers via XHR.
     *
     * @this {Crashmapper.AppView}
     */
    _loadMarkers: function () {
        var dataFile = '/data/collisions.json';
        if (window.location.host.search('localhost') === -1) {
            dataFile += '.gz'; // For remote servers, use gzip.
        }
        var $xhr = $.getJSON(dataFile, _.bind(function (data) {
            //data = data.slice(0, 3000);
            this._createMarkers(data, 0, data.length);
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
     * @this {Crashmapper.AppView}
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
     * @this {Crashmapper.AppView}
     */
    hideProgress: function () {
        this.$progressBar.fadeOut().progressbar('disable');
    },

    /**
     * Update the current popup.
     */
    _updatePopup: function (popup, startIdx, endIdx) {
        var popupTemplate = this._popupTemplate,
            sumData,
            data;

        this._curPopup = popup;
        if (popup) {
            // Memo the template
            if (!popupTemplate) {
                popupTemplate = this._popupTemplate = $('#markerTemplate').html();
            }
            sumData = {};
            data = popup.options.data;
            while (endIdx >= startIdx) {
                Crashmapper.Marker.prototype.addDataPoint(sumData, data[endIdx]);
                endIdx -= 1;
            }
            popup.setContent(Mustache.render(popupTemplate, _.extend({}, popup.options, {
                data: sumData
            })));
        }
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
                self._visibleMarkers.push([$m.children(), $m.data('crashmapper')]);
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
    _redrawVisibleMarkers: function (startIdx, endIdx, force) {
        var zoom = this._map.getZoom(),
            gradient = this._gradient,
            dimension = this._dimensionControl.getDimensionFunction();
        _.each(this._visibleMarkers, function (v) {
            var $m = v[0],
                data = v[1],
                cnt = data.count,
                width,
                color,
                darkColor,
                n = 0,
                d;

            if (data.lastStartValue === startIdx &&
                    data.lastEndValue === endIdx && !force) {
                return;
            }
            d = data.data.slice(startIdx, endIdx + 1);
            // zoom 16: single intersections only           0 1
            // zoom 15: 1 - 5 intersections, avg 3          1 3
            // zoom 14: 3 - 20 intersections, avg 10        2 9
            // zoom 13: 10 - 70 intersections, avg 50       3 27
            // zoom 12: 20 - 200 intersections, avg 100     4 81
            // zoom 11: 50 - 600 intesrsections, avg 250    5 243
            // zoom 10: 150 - 2000 intersections, avg 800   6 729
            // zoom 9:  300 - 5000 intersections, avg 2500  7 2187

            width = 20 * cnt / Math.pow(3, (16 - zoom));

            if (d.length) {
                n = dimension(d, (1 + endIdx - startIdx), cnt);
            }
            if (n > 0) {
                color = gradient(n);
                darkColor = gradient(2 / n);
            } else {
                color = gradient(0);
                darkColor = gradient(2);
            }
            if (cnt > 1) {
                $m.css({
                    'box-shadow': '0px 0px ' + Math.round(width) + 'px ' +
                        Math.round(width * 3 / 4) + 'px' + ' ' + color,
                    'background-color': color,
                    'border': '1px solid ' + darkColor
                });
            } else {
                if (n > 0) {
                    $m.show().css({
                        'background-color': color,
                        'border': '1px solid ' + darkColor
                    });
                } else {
                    $m.hide();
                }
            }
            data.lastStartValue = startIdx;
            data.lastEndValue = endIdx;
        });
    },

    triggerViewChange: function (startYear, startMonth, endYear, endMonth) {
        var _triggerViewChange = _.bind(function () {
            var sliderValues,
                zoom = this._map.getZoom(),
                center = this._map.getCenter();
            if (!startYear || !startMonth || !endYear || !endMonth) {
                sliderValues = this._slider.getValues();
                startYear = sliderValues[0].year;
                startMonth = sliderValues[0].month;
                endYear = sliderValues[1].year;
                endMonth = sliderValues[1].month;
            }
            this.trigger('changeview', startYear, startMonth, endYear, endMonth,
                         this._baseLayerName, this._dimensionControl.dimension,
                         this._dimensionControl.volume, zoom,
                         center.lat, center.lng);
        }, this);

        if (this._ready) {
            _triggerViewChange();
        } else {
            this.on('ready', _triggerViewChange);
        }
    },

    /**
     * @this {Crashmapper.AppView}
     */
    render: function (newStartYear, newStartMonth, newEndYear, newEndMonth,
                      newBase, newDimension, newVolume, newZoom, lat, lng) {
        // initial setup
        var attribution = 'Map data &copy; OpenStreetMap contributors';
        newBase = newBase ? newBase.charAt(0).toUpperCase() + newBase.slice(1).toLowerCase() : 'Standard';
        newDimension = newDimension ? newDimension.toLowerCase() : 'collisions';
        newVolume = newVolume || 2;
        lat = lat || 40.704;
        lng = lng || -73.874;
        newZoom = newZoom || 10;

        if (!this._map) {
            var map = this._map = new L.Map(this.MAP_HOLDER_ID, {
                center: new L.LatLng(lat, lng),
                zoom: newZoom,
                minZoom: 10,
                maxZoom: 17,
                zoomAnimation: false,
                markerZoomAnimation: false,
                zoomControl: false // added later
            });

            var baseLayers = this._baseLayers = {
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

            this._baseLayerName = _.has(baseLayers, newBase) ? newBase : 'Standard';
            map.addLayer(baseLayers[this._baseLayerName]);

            new L.Control.Layers(baseLayers, [], {position: "topleft"}).addTo(this._map);
            new L.Control.Zoom({position: "topleft"}).addTo(this._map);

            this._helpControl = new Crashmapper.HelpControl({
                position: 'topleft'
            }).addTo(this._map);

            this._linkControl = new Crashmapper.LinkControl({
                position: 'topleft'
            }).addTo(this._map);

            this._slider = new Crashmapper.Slider({
                position: "bottomleft",
                min: 7
            });

            this._dimensionControl = new Crashmapper.DimensionControl({
                position: 'topright',
                dimension: newDimension,
                volume: newVolume
            }).addTo(this._map);

            this._map.on('dimensionchange baselayerchange moveend', _.bind(function (e) {
                if (e.type === 'baselayerchange') {
                    this._baseLayerName = e.name;
                }
                var sliderValues = this._slider.getValues(),
                    force = true;
                this.triggerViewChange();
                if (e.type === 'moveend') {
                    this._revalidateVisibleMarkers();
                    force = false;
                }
                this._redrawVisibleMarkers(sliderValues[0].idx,
                                           sliderValues[1].idx, force);
            }, this));

            this._map.on('slide', _.bind(function (e) {
                this.triggerViewChange(e.start.year, e.start.month,
                                       e.end.year, e.end.month);
                this._updatePopup(this._curPopup, e.start.idx, e.end.idx);
                this._redrawVisibleMarkers(e.start.idx, e.end.idx, false);
            }, this));

            this._map.on('popupopen', _.bind(function (e) {
                var vals = this._slider.getValues();
                this._updatePopup(e.popup, vals[0].idx, vals[1].idx);
            }, this));

            this._map.on('popupclose', _.bind(function () {
                this._curPopup = null;
            }, this));

            this._loadMarkers();
        }

        if (newStartYear && newStartMonth && newEndYear && newEndMonth) {
            this._slider.setValues(newStartYear, newStartMonth,
                                   newEndYear, newEndMonth);
        }
        this._map.setZoom(newZoom);
        this._map.panTo(new L.LatLng(lat, lng));

        return this;
    }
});
