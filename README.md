# IoTCloudConnect
This sample code implements the IoT client device connection with the cloud, and perform serverless computing in the cloud backend as shown in this diagram:
![Figure](/Resources/Picture1.png)

## IoT Python Client
Use the following code to run the IoT python client to connect to Google Cloud IoT, you need to add your connection parameters in class Args or enable command line argument parsing by uncomment: args = parse_command_line_args()
```bash
python3 pyclient/IoTclient.py
```
[CMPE-GoogleIoTdata.ipynb](/Notebook/CMPE-GoogleIoTdata.ipynb) is the Colab file to demonstrate the IoT Python code that publish IoT sensor data to Google Cloud IoT

## IoT Nodejs Client
Use the following code to run the IoT nodejs client to connect to Google Cloud IoT, you can add arguments in the command line or change the default arguments in the code
```bash
nodejsclient % node index.js mqttDeviceDemo
```

## Google Pubsub
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
Write the [index.js](/gcpnodefunction/index.js) code inside the gcpnodefunction folder, then deploy the cloud function to the Google Cloud.
1. Run the following code to deploy the IoT pubsub functions to the Cloud Function, the trigger will be the Pubsub topic, whenever the pubsub received the data from the IoT client, this Pubsub topic will trigger this google cloud function
```bash
gcpnodefunction % gcloud functions deploy iotPubSubBQ --runtime nodejs10 --trigger-topic cmpeiotdevice1
```
iotPubSubBQ will parse the received sensor data (json format) and send the data to BigQuery (you need to create the BigQuery dataset and table with schema first)

2. Run the following code to deploy the HTTP based cloud function. HTTP message will trigger this cloud function
```bash
gcpnodefunction %gcloud functions deploy httpApi --runtime nodejs10 --trigger-http
```
You can check the HTTP api (url address) via
```bash
gcloud functions describe httpApi
```
Using the following curl command to test the HTTP GET api to read all sensor data:
```bash
% curl -X GET https://us-central1-cmpelkk.cloudfunctions.net/httpApi -H "Content-Type:application/json"

[{"id":"testiot","data":{"value":"75","number":"2020","sensor":"temperature"}},{"id":"testsensor03","data":{"time":{"_seconds":1587500474,"_nanoseconds":108000000},"name":"testsensor03","sensors":{"name":"Jane"}}},{"id":"testsensor04","data":{"time":{"_seconds":1587500668,"_nanoseconds":523000000},"sensors":{"sensor":"humidity"},"name":"testsensor04"}},{"id":"testsensor05","data":{"time":{"_seconds":1587501599,"_nanoseconds":589000000},"sensors":{"sensor":"humidity","value":96},"name":"testsensor05"}},{"id":"testsensor06","data":{"sensors":{"sensor":"humidity","value":99},"time":{"_seconds":1587509932,"_nanoseconds":457000000},"name":"testsensor06"}}]%  
```
If you add the id in the HTTP get query (add "?id=testsensor06" into the URL), you can get the data from a specific sensor:
```bash
% curl -X GET 'https://us-central1-cmpelkk.cloudfunctions.net/httpApi?id=cmpe181dev1'
No such document!
% curl -X GET 'https://us-central1-cmpelkk.cloudfunctions.net/httpApi?id=testsensor06'
{"time":{"_seconds":1587509932,"_nanoseconds":457000000},"name":"testsensor06","sensors":{"sensor":"humidity","value":99}}%
```
3. Using the following command line to test the send command to IoT devices
```bash
% gcloud iot devices commands send \
    --command-data='test iot1' \   
    --region=us-central1  \
    --registry=CMPEIoT1 \   
    --device=cmpe181dev1
```
You will received the print out from the IoT device side "Received message 'test iot1' on topic '/devices/cmpe181dev1/commands' with Qos 0"

Using the following curl POST command to test the send command to IoT devices
```bash
% curl -X POST https://us-central1-cmpelkk.cloudfunctions.net/httpApi -H "Content-Type:text/plain" -d 'test now'
Get Post request, send command!% 
```