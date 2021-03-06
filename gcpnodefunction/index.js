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
exports.httpApi = async (req, res) => {
    console.log('request body-> ', req.body);
    let bodydata;
    let deviceId;
    let message;

    switch (req.get('content-type')) {
        // '{"deviceId":"testiot1","message":"test message"}'
        case 'application/json':
            //({ bodydata } = req.body);
            //console.log("json content", JSON.stringify(bodydata));
            console.log("json content", req.body)
            //const {deviceId, message} = req.body;
            deviceId=req.body.deviceId
            message=req.body.message
            console.log("deviceId:", deviceId)
            console.log("message:", message)
            break;

        // 'message', stored in a Buffer
        case 'application/octet-stream':
            message = req.body.toString(); // Convert buffer to a string
            break;

        // 'message'
        case 'text/plain':
            message = req.body;
            break;

        // 'message=xx' in the body of a POST request (not the URL)
        case 'application/x-www-form-urlencoded':
            ({ message } = req.body);
            break;
    }

    switch (req.method) {
        case 'GET':
            deviceId = req.query.id;
            console.log(`Get http query:, ${deviceId}`);
            if (!deviceId || deviceId.length === 0) {
                //read all data from the firestore
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
            }else{
                let dbRef = db.collection(dbcollection).doc(deviceId);
                let getDoc = dbRef.get()
                    .then(doc => {
                        if (!doc.exists) {
                            res.status(400).send('No such document!');
                            console.log('No such document!');
                            return;
                        } else {
                            res.status(200).send(doc.data());
                            console.log('Document data:', doc.data());
                            return;
                        }
                    })
                    .catch(err => {
                        console.log('Error getting document', err);
                        res.status(405).send('Error getting document', err);
                        return;
                    });
            }
            
            //res.status(200).send('Get request!');
            break;
        case 'POST':
            if (!deviceId || deviceId.length === 0) {
                console.log('No deviceId')
            }else{
                console.log('POST Method, deviceId: ', deviceId || 'cmpe181dev1');
                const iotcommandOptions = {
                    deviceId: deviceId || 'cmpe181dev1', //'cmpe181dev1',
                    commandMessage: message,
                    projectId: 'cmpelkk',
                    cloudRegion: 'us-central1',
                    registryId: 'CMPEIoT1'
                }
                try {
                    const response = await sendCommand(iotcommandOptions);
                    res.status(200).json(response);
                } catch(err) {
                    console.error('Publish failed ', err.message);
                    res.status(400).json({
                        error: err.message
                    });
                }
            }
            
            
            // sendCommand('cmpe181dev1', 'CMPEIoT1', 'cmpelkk', 'us-central1', 'test command');
            // res.status(200).send('Get Post request, send command!');
            
            // let docRef = db.collection(dbcollection).doc(id);
            // console.log('POST Created doc ref');
            // let setdoc = docRef.set({
            //     name: id,
            //     sensors: bodydata,
            //     time: new Date()
            // });
            // //res.status(200).send(`Post data: ${escapeHtml(bodydata || 'World')}!`);
            // res.status(200).json({
            //     name: id,
            //     sensors: bodydata,
            //     time: new Date()
            // })
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

//ref: https://cloud.google.com/iot/docs/how-tos/commands#api
const sendCommand = async (
    {
        deviceId,
        registryId,
        projectId,
        cloudRegion,
        commandMessage
      }
) => {
    // [START iot_send_command]
    // const cloudRegion = 'us-central1';
    // const deviceId = 'my-device';
    // const commandMessage = 'message for device';
    // const projectId = 'adjective-noun-123';
    // const registryId = 'my-registry';
    const iot = require('@google-cloud/iot');
    const iotClient = new iot.v1.DeviceManagerClient({
        // optional auth parameters.
    });

    const formattedName = iotClient.devicePath(
        projectId,
        cloudRegion,
        registryId,
        deviceId
    );
    const binaryData = Buffer.from(commandMessage);
    const request = {
        name: formattedName,
        binaryData: binaryData,
    };

    try {
        const responses = await iotClient.sendCommandToDevice(request);
        console.log('Sent command: ', responses[0]);
        return {
            message: 'Sent message',
            content: responses[0]
        };
    } catch (err) {
        console.error('Could not send command:', err);
        throw new Error('Could not send command');
    }
    // [END iot_send_command]
};