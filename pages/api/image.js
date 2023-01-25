// Import module
import ee from '@google/earthengine';
import privateKey from './privateKey.json';

// Earth engine app
export default function handler(req, res){
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
        // Variable list
        const body = JSON.parse(req.body);
        const type = body.type;
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

        let aoi;
        // Create a feature collection
        if (type == 'Bounds') {
            aoi = ee.FeatureCollection(ee.Geometry.BBox(geometry.west, geometry.south, geometry.east, geometry.north));
        } else {
            aoi = ee.FeatureCollection(geometry);
        }

        // AOI for filter and clip
        const geom = aoi.geometry();

        // Imagery collection
        const col = ee.ImageCollection("COPERNICUS/S2_SR");

        // Filter the image collection
        let images = col.filterBounds(geom)
            .filterDate(startDate, endDate)
            .filter(ee.Filter.dayOfYear(startRange, endRange))
            .filter(ee.Filter.lte('CLOUDY_PIXEL_PERCENTAGE', cloudFilter));

        // Cloud masking
        if (cloudMasking) {
            images = images.map(cloudMask);
        }
        
        // Composite the image
        const image = images.median()
            .select(['B.*'])
            .clip(geom)
            .set({
                'system:time_start': ee.Date(startDate),
                'system:time_end': ee.Date(endDate)
            })
            .setDefaultProjection('EPSG:4326', null , 10);
        
        const serial = ee.Serializer.toJSON(image);

        // Bands for visualization
        const bands = [red, green, blue]
        
        // Visualization parameter
        const vis = mapVis(image, bands);

        // Callback hell to send data to server
        vis.evaluate(vis => 
            image.getMap(vis, map => { 
                    map.image = JSON.stringify(serial);
                    res.status(202).send(map);
                }
            )
        );
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