// Earth engine app

export default async function handler(req, res){
    // Import module and key
    const ee = require('@google/earthengine');
    const privateKey = require('../api/privateKey.json');

    // Variable list
    const body = await JSON.parse(req.body);
    const type = await body.type;
    const geometry = await body.geojson;
    const startDate = await body.startDate;
    const endDate = await body.endDate;
    const startRange = await body.dateRangePair[0];
    const endRange = await body.dateRangePair[1];
    const cloudFilter = Number(await body.cloudFilter);
    const cloudMasking = await body.cloudMasking;

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
        let geom;

        if (type == 'Bounds') {
            geom = ee.Geometry.BBox(geometry.west, geometry.south, geometry.east, geometry.north);
        } else {
            geom = ee.FeatureCollection(geometry).geometry();
        }

        const col = ee.ImageCollection("COPERNICUS/S2_SR");
        let images = col.filterBounds(geom)
            .filterDate(startDate, endDate)
            .filter(ee.Filter.dayOfYear(startRange, endRange))
            .filter(ee.Filter.lte('CLOUDY_PIXEL_PERCENTAGE', cloudFilter));

        if (cloudMasking) {
            images = images.map(cloudMask);
        }
        
        const image = images.median()
            .select(['B.*'])
            .clip(geom)
            .set({
                'system:time_start': ee.Date(startDate),
                'system:time_end': ee.Date(endDate)
            });
        
        const bands = ['B8', 'B11', 'B2'];

        const vis = mapVis(image, bands);

        vis.evaluate((parameter) => {
            image.getMap(parameter, (data) => {
                res.status(202);
                res.send(data);
                res.end();
            });
        })
    }

    // Cloud masking function
    function cloudMask(image){
        const scl = image.select('SCL');
        const shadow = scl.eq(3);
        const cloud = scl.gte(7).and(scl.lte(10));
        const mask = shadow.or(cloud).eq(0);
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