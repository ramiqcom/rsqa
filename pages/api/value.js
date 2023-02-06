// Import module
import ee from '@google/earthengine';

// Earth engine app
export default function handler (req, res) {
	const privateKey = JSON.parse(process.env.EE_KEY);

	// Authentication
	ee.data.authenticateViaPrivateKey(
		privateKey, () => {
		console.log('Authentication success');
		ee.initialize(
			null,
			null,
			() => {
			console.log('Initialization success');
			init();
			},
		(err) => console.log(err));
		},
		(err) => console.log(err)
	);

	// Init function
	function init(){
		const json = req.body;

		const latlng = json.point;
		const point = ee.Geometry.Point([latlng.lng, latlng.lat]);

		const image = ee.Image(ee.Deserializer.fromCloudApiJSON(json.image));
		const reduce = image.reduceRegion({
			geometry: point,
			scale: image.projection().nominalScale(),
			reducer: ee.Reducer.first(),
		});

		reduce.evaluate(values => res.status(202).send(values));
	}
}