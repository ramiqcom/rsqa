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
    new Promise((resolve, reject) => resolve(req.body))
        .then(geojson => turf.centroid(geojson))
        .then(centroid => centroid.geometry.coordinates)
        .then(coord => res.status(200).send({ lat: coord[1], lng: coord[0] }))
        .catch(err => res.status(404).send({ message: err }))
}