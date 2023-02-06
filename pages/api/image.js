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
	async function init(){
		// Variables list
		const body = req.body;
		const imageCol = body.imageCol;
		const red = body.bandRed;
		const green = body.bandGreen;
		const blue = body.bandBlue;
		const geometry = body.geojson;
		const startDate = body.startDate;
		const endDate = body.endDate;
		const startRange = Number(body.dateRangePair[0]);
		const endRange = Number(body.dateRangePair[1]);
		const cloudFilter = Number(body.cloudFilter);
		const cloudMasking = body.cloudMasking;

		// AOI
		const aoi = ee.FeatureCollection(geometry).geometry();

		// Earth Engine param
		let colId;
		let cloudParam;
		let cloudMaskFunction;
		let bandsList;
		let newBandsList;
		let scaling;
		let offset;
		let imageScale;
		let col;

		// Conditional for collection
		switch (imageCol) {
			case 'sentinel2':
				colId = 'COPERNICUS/S2_SR';
				cloudParam = 'CLOUDY_PIXEL_PERCENTAGE';
				cloudMaskFunction = cloudMaskS2;
				bandsList = ['B.*'];
				newBandsList = ['B1', 'B2', 'B3', 'B4', 'B5', 'B6', 'B7', 'B8', 'B8A', 'B9', 'B11', 'B12'];
				scaling = 0.0001;
				offset = 0;
				imageScale = 10;
				col = collection(colId);
				break;
			case 'landsatOli':
				colId = ['LANDSAT/LC08/C02/T1_L2', 'LANDSAT/LC09/C02/T1_L2'];
				cloudParam = 'CLOUD_COVER';
				cloudMaskFunction = cloudMaskLandsatOli;
				bandsList = ['SR_B.*'];
				newBandsList = ['B1', 'B2', 'B3', 'B4', 'B5', 'B6', 'B7'];
				scaling = 0.0000275;
				offset = -0.02;
				imageScale = 30;
				col = collection(colId[0]);
				break;
		};

		// Cloud masking
		col = cloudMasking ? col.map(cloudMaskFunction) : col;

		// Image
		const image = col.median()
			.select(bandsList, newBandsList)
			.clip(aoi)
			.multiply(scaling)
			.add(offset)
			.set('system:time_start', ee.Date(startDate), 'system:time_end', ee.Date(endDate))
			.setDefaultProjection('EPSG:4326', null, imageScale);

		// Visualization parameter
		const vis = mapVis(image, [red, green, blue]);

		// Send image parameter to client
		try {
			// send image to client
			vis.evaluate(vis => image.getMap(vis, async (map) => {
				map.image = await ee.Serializer.toCloudApiJSON(image);
				res.status(200).send(map);
			}));
		} catch (err) {
			res.status(404).send(err);
		};

		// Colletion filter
		function collection(id){
			return ee.ImageCollection(id)
				.filter(ee.Filter.and(
					ee.Filter.bounds(aoi),
					ee.Filter.date(startDate, endDate),
					ee.Filter.dayOfYear(startRange, endRange),
					ee.Filter.lte(cloudParam, cloudFilter))
				);
		}
	}

	// Cloud masking function
	function cloudMaskS2(image){
		const scl = image.select('SCL');
		const shadow = scl.eq(3);
		const cloud = scl.gte(7).and(scl.lte(10));
		const mask = shadow.or(cloud).eq(0);
		return image.updateMask(mask);
	}

	// Cloud mask for landsat oli collection
	function cloudMaskLandsatOli(image){
		const qa = image.select('QA_PIXEL');
		const dilated = 1 << 1;
		const cirrus = 1 << 2;
		const cloud = 1 << 3;
		const shadow = 1 << 4;
		const mask = qa.bitwiseAnd(dilated).eq(0)
			.and(qa.bitwiseAnd(cirrus).eq(0))
			.and(qa.bitwiseAnd(cloud).eq(0))
			.and(qa.bitwiseAnd(shadow).eq(0));
		return image.updateMask(mask);
	}

	// Function to get min max of data
	function mapVis(image, bands, min=2, max=98, scale=100) {
		const geometry = image.geometry();

		const reduce1 = image.select(bands[0]).reduceRegion({
			geometry: geometry,
			reducer: ee.Reducer.percentile([min, max]),
			scale: scale,
			bestEffort: true,
			maxPixels: 1e13
		});

		const reduce2 = image.select(bands[1]).reduceRegion({
			geometry: geometry,
			reducer: ee.Reducer.percentile([min, max]),
			scale: scale,
			bestEffort: true,
			maxPixels: 1e13
		});

		const reduce3 = image.select(bands[2]).reduceRegion({
			geometry: geometry,
			reducer: ee.Reducer.percentile([min, max]),
			scale: scale,
			bestEffort: true,
			maxPixels: 1e13
		});

		const min1 = ee.Number(reduce1.get(reduce1.keys().get(0)));
		const min2 = ee.Number(reduce2.get(reduce2.keys().get(0)));
		const min3 = ee.Number(reduce3.get(reduce3.keys().get(0)));

		const max1 = ee.Number(reduce1.get(reduce1.keys().get(1)));
		const max2 = ee.Number(reduce2.get(reduce2.keys().get(1)));
		const max3 = ee.Number(reduce3.get(reduce3.keys().get(1)));

		const vis = ee.Dictionary({
			bands: bands,
			min: [min1, min2, min3],
			max: [max1, max2, max3]
		});

		return vis;
	}
}