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
        const json = req.body;

        const latlng = json.point;
        const point = ee.Geometry.Point([latlng.lng, latlng.lat]);

        const image = ee.Image(ee.Deserializer.fromJSON(JSON.parse(json.image)));
        const reduce = image.reduceRegion({
            geometry: point,
            scale: 10,
            reducer: ee.Reducer.first(),
        })

        reduce.evaluate(values => res.status(202).send(values));
    }
}