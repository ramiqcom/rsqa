import ee from '@google/earthengine';
import privateKey from './privateKey.json';

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
            },
        (err) => console.log(err));
        }, 
        (err) => console.log(err)
    );
}