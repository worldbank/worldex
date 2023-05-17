export default {
    nominatim: {
        searchAPI: "https://nominatim.openstreetmap.org/search.php?format=jsonv2&polygon_geojson=1",
        styles: {
            mapnik: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
            osm: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
            hot: "https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png",
            openTopoMap: "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
            openCycleMap: "https://{s}.tile.thunderforest.com/cycle/{z}/{x}/{y}.png",
            openTransportMap: "https://{s}.tile.thunderforest.com/transport/{z}/{x}/{y}.png",
            openLandscapeMap: "https://{s}.tile.thunderforest.com/landscape/{z}/{x}/{y}.png",
            openOutdoorsMap: "https://{s}.tile.thunderforest.com/outdoors/{z}/{x}/{y}.png",
            openTransportDarkMap: "https://{s}.tile.thunderforest.com/transport-dark/{z}/{x}/{y}.png",
            openSpinalMap: "https://{s}.tile.thunderforest.com/spinal-map/{z}/{x}/{y}.png",
            openPioneerMap: "https://{s}.tile.thunderforest.com/pioneer/{z}/{x}/{y}.png",
            openMobileAtlasMap: "https://{s}.tile.thunderforest.com/mobile-atlas/{z}/{x}/{y}.png",
            openNeighbourhoodMap: "https://{s}.tile.thunderforest.com/neighbourhood/{z}/{x}/{y}.png",
            openAtlasMap: "https://{s}.tile.thunderforest.com/atlas/{z}/{x}/{y}.png",
            cartodbBaseMap: "https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png",
            cartodbDarkMap: "https://cartodb-basemaps-{s}.global.ssl.fastly.net/dark_all/{z}/{x}/{y}.png",
            cartodbVoyagerMap: "https://cartodb-basemaps-{s}.global.ssl.fastly.net/rastertiles/voyager/{z}/{x}/{y}.png",
            cartodbVoyagerLabelsUnderMap: "https://cartodb-basemaps-{s}.global.ssl.fastly.net/rastertiles/voyager_nolabels/{z}/{x}/{y}.png",
            cartodbVoyagerLabelsOnlyMap: "https://cartodb-basemaps-{s}.global.ssl.fastly.net/rastertiles/voyager_only_labels/{z}/{x}/{y}.png",
            cartodbVoyagerNoLabelsMap: "https://cartodb-basemaps-{s}.global.ssl.fastly.net/rastertiles/voyager_nolabels_under/{z}/{x}/{y}.png",
        },
    },
    buildSearchUrl(query) {
        return `${this.nominatim.searchAPI}&q=${query}`;
    },
}