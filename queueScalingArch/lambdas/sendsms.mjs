import { BatchWriteCommand, DynamoDBDocumentClient, PutCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { SQSClient, SendMessageBatchCommand, SendMessageCommand } from "@aws-sdk/client-sqs";

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";

const REGION = "eu-west-2";
const ddbClient = new DynamoDBClient({ region: REGION });
const ddbDocClient = DynamoDBDocumentClient.from(ddbClient);
const REQUESTSTABLENAME = process.env['REQUESTSTABLENAME'];
const DELIVERYQUEUEURL = process.env['DELIVERYQUEUEURL'];
const client = new SQSClient();
const BATCHSIZE = 0;

function sleep(ms) {
    console.log("sleeping for " + ms + "ms");
    return new Promise((resolve) => { setTimeout(resolve, ms); });
}

async function sendItemsSQS(items) {
    let params = {
        "QueueUrl": DELIVERYQUEUEURL,
        Entries: []
    };
    for (item of items) {
        params.Entries.push(item);
    }
    const data = await client.send(new SendMessageBatchCommand(params));
    console.log("Success - items added to SQS", data);
    return data;
} 

async function updateItemDDB(params) {
    const data = await ddbDocClient.send(new UpdateCommand(params));
    console.log("Success - item updated", data);
    return data;
} 

async function putItemsDDB(items) {
    let params = {
        "RequestItems": {}
    };
    params.RequestItems[REQUESTSTABLENAME] = [];
    for (let item of items) {
        let requestDetails ={ "PutRequest": {"Item": item}}
        params.RequestItems[REQUESTSTABLENAME].push(requestDetails);
    }
    const data = await ddbDocClient.send(new BatchWriteCommand(params));
    console.log("Success - items added to table", data);
    return data;
} 



export const handler = async (event) => {
    console.log(JSON.stringify(event));
    let items = [];
    for (let i = 0; i < event.Records.length; i++)
    {
        console.log("Processing item " + (i + 1));
        //check that this is an SMS
        if (event.Records[i].eventSource != "aws:sqs") {
            console.log("not processing this item as not received from SQS!");
            continue;
        }
        let messageBody = JSON.parse(event.Records[i].body);
        console.log("partition " + messageBody.request_partition + " sort " + messageBody.request_sort);
        console.log("client id " + messageBody.request_partition);
        //check that it is for a delivery
        if (!messageBody.request_sort || !messageBody.request_sort.endsWith("ROUTEPLAN")) {
            console.log("not processing as not a ROUTEPLAN");
            continue;
        }

        //pretend to send the message
        let updateParams = {
            "TableName": REQUESTSTABLENAME,
            "Key": {
                request_partition: messageBody.request_partition,
                request_sort: messageBody.request_sort
            },
            "UpdateExpression": "set record_status = :s",
            "ExpressionAttributeValues": {
                ":s": "SENT"
            },
            "ReturnValues": "ALL_NEW"
        };
        console.log("sleeping for SMS sending");
        await sleep(100);
        let updateData = await updateItemDDB(updateParams);
    }
    return;
}