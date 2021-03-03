//ref: https://github.com/googleapis/nodejs-firestore
const Firestore = require('@google-cloud/firestore');
// const db = new Firestore({
//     projectId: 'cmpelkk',
//     keyFilename: '~/Documents/GoogleCloud/certs/cmpelkk-380e31c10ee7.json',
// });
const db = new Firestore();
const dbcollection = 'iottests';


// Imports the Google Cloud client library
const { BigQuery } = require('@google-cloud/bigquery');
// Instantiates a client
const bigquery = new BigQuery({
    projectId: 'cmpelkk'
});

// Get a reference to the Pub/Sub component
const { PubSub } = require('@google-cloud/pubsub');
const pubsub = new PubSub();

//gcloud pubsub topics publish cmpeiotdevice1 --message "test pubsub"
/**
 * Background Cloud Function to be triggered by Pub/Sub.
 * This function is exported by index.js, and executed when
 * the trigger topic receives a message.
 *
 * @param {object} data The event payload.
 * @param {object} context The event metadata.
 */
exports.iotPubSubBQ = async (data, context) => {
    const pubSubMessage = data;
    const name = pubSubMessage.data
        ? Buffer.from(pubSubMessage.data, 'base64').toString()
        : 'World';

    console.log(`Hello, ${name}!`);

    const iotdata = JSON.parse(name);
    console.log(iotdata.registry_id);
    //  "Hello, {"registry_id": "CMPEIoT1", "device_id": "cmpe181dev1", "timecollected": "2020-04-27 02:00:21", "zipcode": "94043", "latitude": "37.421655", "longitude": "-122.085637", "temperature": "25.15", "humidity": "78.93", "image_file": "img9.jpg"}!"   

    // Inserts data into a bigquery table
    var rows = [iotdata];
    console.log(`Uploading data to bigquery: ${JSON.stringify(rows)}`);
    bigquery
        .dataset('iottest')
        .table('test1')
        .insert(rows)
        .then((foundErrors) => {
            rows.forEach((row) => console.log('Inserted: ', row));

            if (foundErrors && foundErrors.insertErrors != undefined) {
                foundErrors.forEach((err) => {
                    console.log('Bigquery Error: ', err);
                })
            }
        })
        .catch((err) => {
            console.error('Bigquery ERROR:', err);
        });
    };


const escapeHtml = require('escape-html');
//curl -X POST HTTP_TRIGGER_ENDPOINT -H "Content-Type:application/json"  -d '{"name":"Jane"}'
/**
 * HTTP Cloud Function.
 *
 * @param {Object} req Cloud Function request context.
 *                     More info: https://expressjs.com/en/api.html#req
 * @param {Object} res Cloud Function response context.
 *                     More info: https://expressjs.com/en/api.html#res
 */
exports.httpApi = (req, res) => {
    const id = req.query.id;//req.params.id;
    console.log(`Get http query:, ${id}`);
    let bodydata;

    switch (req.get('content-type')) {
        // '{"name":"John"}'
        case 'application/json':
            ({ bodydata } = req.body);
            console.log("json content", JSON.stringify(bodydata));
            break;

        // 'John', stored in a Buffer
        case 'application/octet-stream':
            bodydata = req.body.toString(); // Convert buffer to a string
            break;

        // 'John'
        case 'text/plain':
            bodydata = req.body;
            break;

        // 'name=John' in the body of a POST request (not the URL)
        case 'application/x-www-form-urlencoded':
            ({ bodydata } = req.body);
            break;
    }
    //bodydata =req.body
    if (bodydata) {
        console.log(`Get body query:, ${bodydata}`);
    } else {
        bodydata = req.body ? req.body : 'nobody';
        console.log(`No body query: ${bodydata}`);
        console.log(bodydata);
    }
    switch (req.method) {
        case 'GET':
            const datalist = [];
            db.collection(dbcollection).get()
                .then((snapshot) => {
                    snapshot.forEach((doc) => {
                        console.log(doc.id, '=>', doc.data());
                        datalist.push({
                            id: doc.id,
                            data: doc.data()
                        });
                    });
                    res.status(200).send(datalist);
                })
                .catch((err) => {
                    console.log('Error getting documents', err);
                    res.status(405).send('Error getting data');
                });
            //res.status(200).send('Get request!');
            break;
        case 'POST':
            let docRef = db.collection(dbcollection).doc(id);
            console.log('POST Created doc ref');
            let setdoc = docRef.set({
                name: id,
                sensors: bodydata,
                time: new Date()
            });
            //res.status(200).send('Get Post request!');
            //sendCommand('cmpe181dev1', 'CMPEIoT1', 'cmpelkk', 'us-central1', 'test command');
            //res.status(200).send(`Post data: ${escapeHtml(bodydata || 'World')}!`);
            res.status(200).json({
                name: id,
                sensors: bodydata,
                time: new Date()
            })
            break;
        case 'PUT':
            let docdelRef = db.collection(dbcollection).doc(id);
            console.log('PUT Created doc ref');
            let deldoc = docdelRef.set({
                name: id,
                sensors: bodydata,
                time: new Date()
            });
            res.status(200).json({
                name: id,
                sensors: bodydata,
                time: new Date()
            })
            //res.status(403).send('Forbidden!');
            break;
        case 'DELETE':
            if (!id) {
                res.status(405).send('query document id not available');
            } else {
                let deleteDoc = db.collection(dbcollection).doc(id).delete();
                res.status(200).send('Deleted!');
            }
            break;
        default:
            res.status(405).send({ error: 'Something blew up!' });
            break;
    }
    //res.send(`Hello ${escapeHtml(req.query.name || req.body.name || 'World')}!`);
};

