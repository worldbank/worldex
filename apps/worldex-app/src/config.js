export default {
    nominatim: {
        searchAPI: "https://nominatim.openstreetmap.org/search.php?format=jsonv2&polygon_geojson=1"
    },
    buildSearchUrl(query) {
        return `${this.nominatim.searchAPI}&q=${query}`;
    }
}