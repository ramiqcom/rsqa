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
        const serial = JSON.parse(req.body);
        console.log(serial);
    }
}