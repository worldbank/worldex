import h3const from "./h3const";

export default {
    calculateResolution(area) {
        // const area = this.calculateArea(bound);

        // Define your resolution-to-area mapping based on your requirements
        const resolutionMap = h3const.h3.dim.map((item) => {
            return {
                resolution: item.res,
                areaThreshold: item.area_km2 * 100  // Approximately 100 cells in the viewport
            }
        });
        // [
        //     { resolution: 1, areaThreshold: 100000000 },
        //     { resolution: 2, areaThreshold: 50000000 },
        //     { resolution: 3, areaThreshold: 10000000 },
        //     { resolution: 4, areaThreshold: 5000000 },
        //     { resolution: 5, areaThreshold: 1000000 },
        //     { resolution: 6, areaThreshold: 500000 },
        //     { resolution: 7, areaThreshold: 100000 },
        //     { resolution: 8, areaThreshold: 50000 },
        //     { resolution: 9, areaThreshold: 10000 },
        //     { resolution: 10, areaThreshold: 5000 },
        //     // Add more resolution levels and area thresholds as needed
        // ];

        console.log("resolutionMap", area, resolutionMap);

        // Find the highest resolution level where the area is below the threshold
        const selectedResolution = resolutionMap.find(level => area > level.areaThreshold);
        console.log("selectedResolution", selectedResolution);

        return selectedResolution ? selectedResolution.resolution : 0;
    },
    calculateArea(bounds) {
        // const { getWest, getSouth, getEast, getNorth } = bounds;
        const west = bounds.getWest();
        const south = bounds.getSouth();
        const east = bounds.getEast();
        const north = bounds.getNorth();

        // Calculate the area based on the bounding box coordinates
        const area = (east - west) * (north - south);
        console.log("area", area);
        return area;
    }

}