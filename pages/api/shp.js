// Convert shp to geojson

// Import module
import * as turf from '@turf/turf';
const shapefileToGeojson = require("shapefile-to-geojson");
const formidable = require('formidable');
const fs = require('fs');
const decompress = require('decompress');

// Disabled body parser
export const config = {
	api: {
    bodyParser: false,
    responseLimit: '8mb',
	}
};

// Main function for API
export default function handler(req, res){
  const form = new formidable.IncomingForm();

  form.parse(req, (err, fields, files) => {
    const path = files.file.filepath;
    const newPath = path + '.zip';

    fs.rename(path, newPath, (err) => {
      decompress(newPath, path)
        .then(async () => {
          const geojson = await shapefileToGeojson.parseFolder(path);

          geojson.features.map(data => data.properties = null);
          let simplify = turf.simplify(geojson, {tolerance: 0.001, mutate: true});

          if (simplify.features.length > 1) {
            simplify = turf.dissolve(simplify)
          }

          res.status(200).send(simplify);
        });
    })
  });
}