const { GetObjectCommand, HeadObjectCommand, S3Client, CopyObjectCommand, DeleteObjectCommand , PutObjectCommand} = require('@aws-sdk/client-s3');
const REGION = "eu-west-2";
const s3Client = new S3Client({
    apiVersion: '2006-03-01',
    region: REGION
})
const REQUESTSTABLENAME = process.env['REQUESTSTABLENAME'];
const HEADERSTART = "messageid,";
const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, PutCommand, BatchWriteCommand} = require("@aws-sdk/lib-dynamodb");
const ddbClient = new DynamoDBClient({ region: REGION });
const ddbDocClient = DynamoDBDocumentClient.from(ddbClient);
const DEFAULTEXPIRY = 600;
const BATCHSIZE = 5;

const SPLITTINGSIZE = 5000; //
async function getS3Object(params) {
    const response = await s3Client
        .send(new GetObjectCommand(params))
    const stream = response.Body;

    return new Promise((resolve, reject) => {
        const chunks = []
        stream.on('data', chunk => { console.log("received a chunk"); chunks.push(chunk) })
        stream.on('end', () => resolve(Buffer.concat(chunks)))
        stream.on('error', err => reject(err))
    });
    // if readable.toArray() is support
    // return Buffer.concat(await stream.toArray())
}


function sleep(ms) {
    console.log("sleeping for " + ms + "ms");
    return new Promise((resolve) => { setTimeout(resolve, ms); });
}

async function putItemDDB(item) {
    let params = {
        "TableName": REQUESTSTABLENAME,
        "Item": item
    };
    const data = await ddbDocClient.send(new PutCommand(params));
    console.log("Success - item added to table", data);
    return data;
} 

async function putItemsDDB(items) {
    let params = {
        "RequestItems": {}
    };
    params.RequestItems[REQUESTSTABLENAME] = [];
    for (item of items) {
        try {
            let requestDetails ={ "PutRequest": {"Item": item}}
            params.RequestItems[REQUESTSTABLENAME].push(requestDetails);
        } catch (error) {
            console.log("Caught error processing row " + item);
        }
    }
    const data = await ddbDocClient.send(new BatchWriteCommand(params));
    console.log("Success - items added to table", data);
    return data;
} 

async function writeSplitFile(items, bucket, key, splitNo)
{
    let body = items.reduce((accumulator, currentvalue) => { return accumulator + "\n" + currentvalue });
    let params = {
        "Body": body,
        "Bucket": bucket,
        "Key": key + "." + splitNo
    }
    const response = await s3Client
        .send(new PutObjectCommand(params))
    return response;
}

exports.handler = async (event) => {
    console.log(JSON.stringify(event));
    console.log("DDB table name is " + REQUESTSTABLENAME);
    console.log("Starting to process file at " + (Date.now()/1000));
    try {
        let bucket = event.Records[0].s3.bucket.name;
        let key = event.Records[0].s3.object.key;
        console.log("bucket is " + bucket + " and key is " + key);
        let params = {
            Key: key,
            Bucket: bucket,
        };
        const objectData = await s3Client.send(new HeadObjectCommand(params));
        if (key.endsWith("csv")) {
            let clientId = objectData.Metadata.clientid;
            let batchId = objectData.Metadata.batchid;
            console.log("client id is " + clientId + " and batch id is " + batchId);
            let buf = await getS3Object(params);
            //convert the Buffer to an array of strings - one for each line
            let rowArray = buf.toString().split(/(?:\r\n|\r|\n)/g);
            console.log("Row Count is " + rowArray.length);
            let itemsAdded = 0;
            let items = [];
            let splitNo = 1;
            for (let i = 0; i < rowArray.length; i++) {
                let row = rowArray[i];
                console.log("row is " + row);
                let rowItems = row.split(",");
                if (rowItems.length < 3 || row.startsWith(HEADERSTART)) {
                    console.log("skipping row");
                    continue;
                }
                let requestId = rowItems[0];
                let nhsnumber = rowItems[1];
                let requestTime = rowItems[2];
                let request_partition = clientId;
                let request_sort = batchId + requestId + "REQITEM";
                let record_status = "ACCEPTED";
                let item = {
                    request_partition: request_partition,
                    request_sort: request_sort,
                    client_id: clientId,
                    batch_id: batchId,
                    nhs_number: nhsnumber,
                    request_time: requestTime,
                    time_received: Date.now() / 1000,
                    date_received: parseInt(new Date().toISOString().substring(0,10).replace("-", "")),
                    request_id: requestId,
                    record_status: record_status,
                    record_type: "REQITEM",
                    valid_until: (Date.now()/1000) + DEFAULTEXPIRY
                }
                if (rowItems.length > 3) {
                    let inputJson = JSON.parse(Buffer.from(rowItems[3], "base64").toString("utf8"));
                    item = { ...item, ...inputJson };
                }
                items.push(JSON.stringify(item).replace("\n","").replace("\r", ""));
                if (items.length == SPLITTINGSIZE) {
                    let data = await writeSplitFile(items, bucket, key, splitNo);
                    itemsAdded += SPLITTINGSIZE;
                    console.log("have put " + SPLITTINGSIZE + " items into split file");
                    //clear the array
                    items = [];
                    //increment split count
                    splitNo += 1;
                }
            }
            //check if need to write remaining items
            if (items.length > 0) {
                let data = await writeSplitFile(items, bucket, key, splitNo);
                itemsAdded += items.length;
                console.log("have put " + items.length + " items into split file");
                //clear the array
                items = [];
            }
            let batch_item = {
                request_partition: clientId,
                request_sort: batchId + "REQBATCH",
                client_id: clientId,
                batch_id: batchId,
                record_status: "ACCEPTED",
                number_item: itemsAdded,
                record_type: "REQBATCH",
                time_received: Date.now() / 1000,
                date_received: parseInt(new Date().toISOString().substring(0,10).replace("-", "")),
                valid_until: (Date.now()/1000) + DEFAULTEXPIRY
            }
            let response = await putItemDDB(batch_item);
            console.log("have put batch item into ddb");
            //move original S3 item by doing copy/delete
            let copyObjectCommandParams = {
                CopySource: bucket + "/" + key,
                Key: key.replace("input/", "processed/"),
                Bucket: bucket,
            };
            let copyObjectResponse = await s3Client.send(new CopyObjectCommand(copyObjectCommandParams));
            console.log(JSON.stringify(copyObjectResponse));
            let deleteObjectResponse = await s3Client.send(new DeleteObjectCommand(params));
            console.log(JSON.stringify(deleteObjectResponse));
            console.log("Finished processing file at " + (Date.now()/1000));
            return {};
        }
        else
        {
            let buf = await getS3Object(params);
            //convert the Buffer to an array of strings - one for each line
            let rowArray = buf.toString().split(/(?:\r\n|\r|\n)/g);
            console.log("Row Count is " + rowArray.length);
            let items = [];
            for (let i = 0; i < rowArray.length; i++) {
                let row = rowArray[i];
                console.log("row is " + row);
                let item = null;
                try {
                    item = JSON.parse(row);
                } catch (error) {
                    console.log("Row is not valid JSON - skipping");
                    continue;
                } 
                if (BATCHSIZE > 0) {
                    //doing batch write to DDB
                    items.push(item);
                    if (items.length == BATCHSIZE) {
                        let data = await putItemsDDB(items);
                        console.log("have put " + BATCHSIZE + " items into ddb");
                        //clear the array
                        items = [];
                    }
                }
                else {
                    //doing single item write
                    let response = await putItemDDB(item);
                    console.log("have put item into ddb");
                }
            }
            //check if need to write remaining items
            if (items.length > 0) {
                let data = await putItemsDDB(items);
                itemsAdded += items.length;
                console.log("have put " + items.length + " items into ddb");
                //clear the array
                items = [];
            }
            //move original S3 item by doing copy/delete
            let copyObjectCommandParams = {
                CopySource: bucket + "/" + key,
                Key: key.replace("input/", "processed/"),
                Bucket: bucket,
            };
            let copyObjectResponse = await s3Client.send(new CopyObjectCommand(copyObjectCommandParams));
            console.log(JSON.stringify(copyObjectResponse));
            let deleteObjectResponse = await s3Client.send(new DeleteObjectCommand(params));
            console.log(JSON.stringify(deleteObjectResponse));
            console.log("Finished processing file at " + (Date.now()/1000));
            return {};
        }
    } catch (error) {
        console.log("caught error " + error.message);
        throw error;
    }
}