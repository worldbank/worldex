<template>
    <div style="height: 100%; width: 100vw;">
        <l-map ref="map" :zoom="zoom" :center="center" :use-global-leaflet="false">
            <l-tile-layer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" layer-type="base"
                name="OpenStreetMap"></l-tile-layer>
        </l-map>
    </div>
</template>

<script>
import "leaflet/dist/leaflet.css";
// import L from "leaflet";
import { LMap, LTileLayer } from "@vue-leaflet/vue-leaflet";

export default {
    mounted() {
        window.map = this;
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
        }
    },
    watch: {

        '$route.query.search': {
            handler: function (search) {
                const q = this.$route.query.search
                const url = `https://nominatim.openstreetmap.org/search.php?q=${q}&format=jsonv2`
                this.$http.get(url).then((res) => {
                    this.data = res.data

                    if (this.data.length === 0) {
                        return
                    }

                    // Data in string, so convert string to float
                    const lat = parseFloat(this.data[0].lat)
                    const lon = parseFloat(this.data[0].lon)

                    this.center = [lat, lon]
                    // this.zoom = this.data[0].place_rank

                    this.fitMapToBounds(this.data[0].boundingbox)

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

<style></style>

<!--  -->