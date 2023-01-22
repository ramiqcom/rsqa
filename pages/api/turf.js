export const config = {
    api: {
        bodyParser: {
            sizeLimit: '8mb' // Set desired value here
        }
    }
}

// Import module
import * as turf from '@turf/turf';

// Export default function
export default function handler(req, res) {
    let geojson = JSON.parse(req.body);
    let centroid = turf.centroid(geojson);
    let coord = centroid.geometry.coordinates;

    let lat = coord[1];
    let lng = coord[0];

    res.statusCode = 200;
    res.send( {lat, lng} );
    res.end();
}