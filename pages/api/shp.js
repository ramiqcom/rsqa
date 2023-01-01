// Convert shp to geojson

const formidable = require('formidable');
const shapefileToGeojson = require("shapefile-to-geojson");
const fs = require('fs');
const decompress = require('decompress');

// Disabled body parser
export const config = {
	api: {
	  bodyParser: false,
    responseLimit: false,
	}
};

// Main function for API
export default async function handler(req, res){
	const form = new formidable.IncomingForm();

  form.parse(req, async (err, fields, files) => {
    const path = await files.file.filepath;
    const newPath = path+'.zip';

    fs.rename(path, newPath, (err) => {
      decompress(newPath, path)
        .then(async (files) => {

          let geojson = await shapefileToGeojson.parseFolder(path);
          return res.send(await geojson);

        });
    })
  });
}