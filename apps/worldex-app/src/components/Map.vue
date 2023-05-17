<template>
    <div id="map-container">
        <l-map ref="map" :zoom="zoom" :center="center" :use-global-leaflet="false">
            <l-tile-layer :url="this.$config.nominatim.styles.cartodbBaseMap" layer-type="base"
                name="OpenStreetMap"></l-tile-layer>
        </l-map>
        <!-- <div id="map"></div> -->
    </div>
</template>

<script>
import "leaflet/dist/leaflet.css";
import 'leaflet-draw/dist/leaflet.draw.css';
import * as turf from '@turf/turf'

import L from "leaflet";
import 'leaflet-geometryutil';
import 'leaflet-draw';
import geojson2h3 from 'geojson2h3';

import { polygonToCells, cellToBoundary } from 'h3-js';
import { LMap, LTileLayer } from "@vue-leaflet/vue-leaflet";

export default {
    mounted() {
        window.map = this;

        // this.map = L.map('map').setView(this.center, this.zoom);
        // L.tileLayer(this.$config.nominatim.styles.cartodbBaseMap, {
        //     attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors',
        //     maxZoom: 18,
        // }).addTo(this.map);

        // this.$refs.map.leafletObject.on('load', () => {
        //     this.fillH3();
        //     this.$refs.map.leafletObject.on('moveend', this.handleMapMoveEnd);
        // });

    },
    components: {
        LMap,
        LTileLayer,
    },
    data() {
        return {
            zoom: 2,
            data: null,
            center: [0, 0],
            overlay: null,
            h3Ovelay: null,
            hexagonsGeoJSON: null,
            map: null,
            registered: false,
        };
    },
    methods: {
        fitMapToBounds(boundingBox) {
            const mapInstance = this.$refs.map.leafletObject;
            // const southWest = L.latLng(parseFloat(boundingBox[0]), parseFloat(boundingBox[2]));
            // const northEast = L.latLng(parseFloat(boundingBox[1]), parseFloat(boundingBox[3]));
            // const bounds = L.latLngBounds(southWest, northEast);
            mapInstance.fitBounds([
                [parseFloat(boundingBox[0]), parseFloat(boundingBox[2])],
                [parseFloat(boundingBox[1]), parseFloat(boundingBox[3])],
            ]
            );
        },
        fillH3() {
            const map = this.$refs.map.leafletObject;

            const bounds = map.getBounds();
            const boundsGeoJSON = {
                type: 'Feature',
                geometry: {
                    type: 'Polygon',
                    coordinates: [[
                        [bounds.getWest(), bounds.getSouth()],
                        [bounds.getWest(), bounds.getNorth()],
                        [bounds.getEast(), bounds.getNorth()],
                        [bounds.getEast(), bounds.getSouth()],
                        [bounds.getWest(), bounds.getSouth()]
                    ]]
                }
            };
            const hexagons = geojson2h3.featureToH3Set(boundsGeoJSON, this.getH3Resolution());
            console.log(hexagons);

            // Convert H3 hexagons to GeoJSON format
            this.hexagonsGeoJSON = geojson2h3.h3SetToMultiPolygonFeature(hexagons, true);
            // this.hexagonsGeoJSON = geojson2h3.h3SetToFeatureCollection(hexagons);  // This creates problems when removing the layer.

            // // Create a Leaflet GeoJSON layer and add it to the map
            this.h3Ovelay = L.geoJSON(this.hexagonsGeoJSON, {
                style: function (feature) {
                    return {
                        fillColor: 'green',
                        weight: 2,
                        opacity: 0.5,
                        color: 'white',
                        fillOpacity: 0.01
                    };
                }
            }).on("remove", () => {
                console.log("remove");
                // wait for 200ms to remove the layer
                setTimeout(() => {
                    this.h3Ovelay = null;
                    this.fillH3();
                }, 500);
            });

            this.h3Ovelay.addTo(map);
        },
        createH3Overlay() {
            const map = this.$refs.map.leafletObject;

            if (this.h3Ovelay !== null) {
                // The overlay will be recreated when the layer is removed.
                map.removeLayer(this.h3Ovelay)
            } else {
                this.fillH3();
            }
        },
        handleMapMoveEnd() {
            this.createH3Overlay();
        },
        getH3Resolution() {
            const map = this.$refs.map.leafletObject;

            // return this.calculateResolution(map.getBounds());
            const geoJSON = this.bound2GeoJSON(map)
            console.log("geoJSON", geoJSON.coordinates);


            var area = L.GeometryUtil.geodesicArea(L.polygon(geoJSON.coordinates).getLatLngs()[0]);
            var areaSqKM = turf.area(turf.polygon(geoJSON.coordinates)) / 1000000; // Convert to square kilometers;
            console.log("geodesicArea", area);
            console.log("turf.area", areaSqKM);

            // const areaInSquareMeters = this.bound2GeoJSON(map).properties.area;
            // return this.$compute.calculateResolution(map.getBounds());
            return this.$compute.calculateResolution(areaSqKM);
        },
        bound2GeoJSON(map) {
            const bounds = map.getBounds();

            const boundsGeoJSON = {
                type: 'Polygon',
                coordinates: [[
                    [bounds.getWest(), bounds.getSouth()],
                    [bounds.getWest(), bounds.getNorth()],
                    [bounds.getEast(), bounds.getNorth()],
                    [bounds.getEast(), bounds.getSouth()],
                    [bounds.getWest(), bounds.getSouth()]
                ]]
            };
            return boundsGeoJSON
        },
        calculateResolution(bounds) {
            const area = this.calculateArea(bounds);
            // Define your resolution-to-area mapping based on your requirements
            const resolutionMap = [
                { resolution: 1, areaThreshold: 100000000 },
                { resolution: 2, areaThreshold: 50000000 },
                { resolution: 3, areaThreshold: 10000000 },
                // Add more resolution levels and area thresholds as needed
            ];

            // Find the highest resolution level where the bounding area is below the threshold
            const selectedResolution = resolutionMap.find(
                level => area < level.areaThreshold
            );

            return selectedResolution ? selectedResolution.resolution : 0;
        },
        clearOverlays() {
            if (this.$refs.map === undefined) {
                return;
            }

            const map = this.$refs.map.leafletObject;
            if (this.overlay !== null) {
                map.removeLayer(this.overlay);
                this.overlay = null;
            }
            if (this.h3Ovelay !== null) {
                map.removeLayer(this.h3Ovelay);
                this.h3Ovelay = null;
            }

        },
    },
    watch: {

        '$route.query.search': {
            handler: function (search) {
                this.clearOverlays();


                const url = this.$config.buildSearchUrl(this.$route.query.search);
                //  `https://nominatim.openstreetmap.org/search.php?q=${q}&format=jsonv2&polygon_geojson=1`
                this.$http.get(url).then((res) => {
                    const map = this.$refs.map.leafletObject;

                    this.data = res.data

                    if (this.data.length === 0) {
                        return
                    }

                    const focus = this.data[0]

                    // Data in string, so convert string to float
                    const lat = parseFloat(focus.lat)
                    const lon = parseFloat(focus.lon)

                    this.center = [lat, lon]
                    // this.zoom = this.data[0].place_rank

                    this.fitMapToBounds(focus.boundingbox)


                    this.overlay = L.geoJSON(focus.geojson).addTo(map);

                    this.createH3Overlay();

                    if (!this.registered) {
                        map.on('moveend', this.handleMapMoveEnd);
                        this.registered = true;
                    }

                    // this.$refs.map.leafletObject.fitBounds(this.data[0].boundingbox.map((x) => parseFloat(x))
                    // this.$refs.map.leafletObject.setView([lat, lon], 5);
                })
                console.log(search)
            },
            deep: true,
            immediate: true
        }

    },
};
</script>

<style>
#map-container {
    height: 100%;
    width: 100vw;
}
</style>

<!--  -->