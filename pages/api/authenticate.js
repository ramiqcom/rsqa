export default function handler(req, res){
    const ee = require('@google/earthengine');
    const privateKey = require('./privateKey.json');

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