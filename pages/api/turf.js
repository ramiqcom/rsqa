// Import module
import * as turf from '@turf/turf';

// Export default function
export default async function handler(req, res) {
    let geojson = await JSON.parse(req.body);
    let centroid = turf.centroid(geojson);
    let coord = centroid.geometry.coordinates;

    let lat = coord[1];
    let lng = coord[0];

    await res.send( {lat, lng} );
}