# IoTCloudConnect
This sample code implements the IoT client device connection with the cloud, and perform serverless computing in the cloud backend as shown in this diagram:
![Figure](/Resources/Picture1.png)

##IoT Python Client
Use the following code to run the IoT python client to connect to Google Cloud IoT, you need to add your connection parameters in class Args or enable command line argument parsing by uncomment: args = parse_command_line_args()
```bash
python3 pyclient/IoTclient.py
```

##IoT Nodejs Client
Use the following code to run the IoT nodejs client to connect to Google Cloud IoT, you can add arguments in the command line or change the default arguments in the code
```bash
nodejsclient % node index.js mqttDeviceDemo
```

##Google Pubsub
Use the sub.py code to receive the realtime data from the IoT client, this can be used to check whether the Cloud received the data or not. 
1. Before you run the code, you need to link the service account credential in the command line: 
```bash
export GOOGLE_APPLICATION_CREDENTIALS=XXX/certs/cmpelkk-380e31c10ee7.json
```
2. setup the subscription for Pubsub in the command line: 
```bash
gcloud pubsub subscriptions create projects/cmpelkk/subscriptions/cmpe181dev1-subscription --topic=projects/cmpelkk/topics/cmpeiotdevice1
```
3. Run your IoT client code to send continuous data to the cloud, in another terminal, run the sub.py to receive the realtime data from the IoT client
```bash
python pyclient/sub.py $PROJECT my-subscription
```

## Google Cloud Function
Write the index.js code inside the gcpnodefunction folder, then deploy the cloud function to the Google Cloud.
1. Run the following code to deploy the IoT pubsub functions to the Cloud Function, the trigger will be the Pubsub topic, whenever the pubsub received the data from the IoT client, this Pubsub topic will trigger this google cloud function
```bash
gcloud functions deploy iotPubSubBQ --runtime nodejs10 --trigger-topic cmpeiotdevice1

```
iotPubSubBQ will parse the received sensor data (json format) and send the data to BigQuery (you need to create the BigQuery dataset and table with schema first)
