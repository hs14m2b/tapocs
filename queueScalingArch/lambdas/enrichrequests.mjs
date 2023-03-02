import { BatchWriteCommand, DynamoDBDocumentClient, PutCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { SQSClient, SendMessageBatchCommand, SendMessageCommand } from "@aws-sdk/client-sqs";

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";

const REGION = "eu-west-2";
const ddbClient = new DynamoDBClient({ region: REGION });
const ddbDocClient = DynamoDBDocumentClient.from(ddbClient);
const REQUESTSTABLENAME = process.env['REQUESTSTABLENAME'];
const SMSDELIVERYQUEUEURL = process.env['SMSDELIVERYQUEUEURL'];
const EMAILDELIVERYQUEUEURL = process.env['EMAILDELIVERYQUEUEURL'];
const client = new SQSClient();
const DEFAULTEXPIRY = 600;
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
        //check that this is an insert
        if (event.Records[i].eventSource != "aws:sqs") {
            console.log("not processing this item as not received from SQS!");
            continue;
        }
        let messageBody = JSON.parse(event.Records[i].body);
        console.log("partition " + messageBody.request_partition["S"] + " sort " + messageBody.request_sort["S"]);
        console.log("nhs number " + messageBody.nhs_number["S"]);
        console.log("client id " + messageBody.request_partition["S"]);
        //check that it is for a request
        if (!messageBody.request_sort || !messageBody.request_sort["S"] || !messageBody.request_sort["S"].endsWith("REQITEM")) {
            console.log("not processing as not a REQITEM");
            continue;
        }
        let batch_id = messageBody.batch_id["S"];
        let request_id = messageBody.request_id["S"];
        //get the demographics info
        let demoItem = {
            request_partition: messageBody.request_partition["S"],
            request_sort: messageBody.request_sort["S"] + "DEMOGRAPHICS",

        }
        let updateParams = {
            "TableName": REQUESTSTABLENAME,
            "Key": {
                request_partition: messageBody.request_partition["S"],
                request_sort: messageBody.request_sort["S"]
            },
            "UpdateExpression": "set email = :e, mobile_phone = :m, record_status = :s, active_plan = :p",
            "ExpressionAttributeValues": {
                ":e": "me@you.com",
                ":m": "07765432109",
                ":s": "ENRICHED",
                ":p": "001"
            },
            "ReturnValues": "ALL_NEW"
        };
        console.log("sleeping for demographics retrieval");
        await sleep(30);
        let updateData = await updateItemDDB(updateParams);
        //get the routing plan for the message
        console.log("sleeping for retrieval of routing info");
        await sleep(100);
        let plan1channel = (Math.random() > 0.5) ? "SMS" : "EMAIL";
        let plan2channel = (plan1channel == "SMS") ? "EMAIL" : "SMS";
        let plan001 = {
            request_partition: messageBody.request_partition["S"],
            request_sort: batch_id + request_id + "001" + "ROUTEPLAN",
            record_type: "ROUTEPLAN",
            record_status: "ACTIVE",
            channel: plan1channel,
            endpoint: "07765432109",
            batch_id: batch_id,
            request_id: request_id,
            plan_sequence: 1,
            valid_until: Date.now()+DEFAULTEXPIRY
        };
        let plan002 = {
            request_partition: messageBody.request_partition["S"],
            request_sort: batch_id + request_id + "002" + "ROUTEPLAN",
            record_type: "ROUTEPLAN",
            record_status: "PENDING",
            channel: plan2channel,
            endpoint: "me@you.com",
            batch_id: batch_id,
            request_id: request_id,
            plan_sequence: 2,
            valid_until: Date.now()+DEFAULTEXPIRY
        };
        let plans = [plan001, plan002];
        //batch insert the items into DDB
        await putItemsDDB(plans);
        //publish the event to the "send requests" queue
        let sqsParams = {
            DelaySeconds: 0,
            MessageAttributes: {
                "channel": {
                    "DataType": "String",
                    "StringValue": plan001.channel
                }
            },
            MessageBody: JSON.stringify(plan001),
            QueueUrl: (plan001.channel == "SMS") ? SMSDELIVERYQUEUEURL : EMAILDELIVERYQUEUEURL
        }
        const response = await client.send(new SendMessageCommand(sqsParams));
        console.log(JSON.stringify(response));
    }
    return;
}