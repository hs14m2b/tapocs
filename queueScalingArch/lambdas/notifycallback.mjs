import { DEFAULTEXPIRY, putItemDDB, putItemsDDB, putUnprocessedItemsDDB, runQueryDDB, updateItemDDB } from "./constants.mjs";
import { DELIVERED, SQSBATCHSIZE } from './constants.mjs';
import { SQSClient, SendMessageBatchCommand, SendMessageCommand } from "@aws-sdk/client-sqs";

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

const REGION = "eu-west-2";
const ddbClient = new DynamoDBClient({ region: REGION });
const ddbDocClient = DynamoDBDocumentClient.from(ddbClient);
const REQUESTSTABLENAME = process.env['REQUESTSTABLENAME'];
const DELIVEREDQUEUEURL = process.env['DELIVEREDQUEUEURL'];
const FAILEDQUEUEURL = process.env['FAILEDQUEUEURL'];
const client = new SQSClient();

function sleep(ms) {
    console.log("sleeping for " + ms + "ms");
    return new Promise((resolve) => { setTimeout(resolve, ms); });
}

async function sqsHandler(event) {
    
}

async function processCallback(event) {
    let body = JSON.parse(event.body);
    //"{\"id\": \"cdbb5ad6-60c9-48d3-bee2-a6bb82f50772\", \"reference\": \"12345.1678106342.fae747d6-29b7-406a-b036-c361b96664eb\", \"to\": \"matthewandkaren@hotmail.com\", \"status\": \"delivered\", \"created_at\": \"2023-03-06T12:39:15.351270Z\", \"completed_at\": \"2023-03-06T12:39:23.457754Z\", \"sent_at\": \"2023-03-06T12:39:15.494697Z\", \"notification_type\": \"email\", \"template_id\": \"b844408b-e85d-470d-9d56-49bbc20f282d\", \"template_version\": 1}"
    //reference is partition.sort
    let status = body.status.toUpperCase();
    let targetQueueUrl = (status == DELIVERED) ? DELIVEREDQUEUEURL : FAILEDQUEUEURL;
    //publish the event to the queue
    let sqsParams = {
        DelaySeconds: 0,
        MessageBody: event.body,
        QueueUrl: targetQueueUrl
    }
    const sendMessageResponse = await client.send(new SendMessageCommand(sqsParams));
    console.log(JSON.stringify(sendMessageResponse));
    return sendMessageResponse;
}

export const handler = async (event) => {
    console.log(JSON.stringify(event));
    //check if this is a SQS lambda invocation
    let apigwEvent = true;
    let failedItems = {
        "batchItemFailures": []
    }
    if (event.Records && event.Records.length > 0 && event.Records[0].eventSource.toUpperCase() == "AWS:SQS") {
        console.log("Handing off to SQS handler!");
        apigwEvent = false;
    }
    let events = [];
    if (apigwEvent) {
        events.push(event);
    }
    else {
        events = events.concat(event.Records);
    }
    console.log("events length is " + events.length);
    try {
        for (let callback_event of events)
        {
            try {
                await processCallback(callback_event);  
            } catch (error) {
                if (!apigwEvent)
                {
                    let itemIdentifier = callback_event.messageId;
                    let failedItem = {
                        "itemIdentifier": itemIdentifier
                    };
                    failedItems.batchItemFailures.push(failedItem);
                }
            }
        }
        let response = (apigwEvent) ? {
            "status": 200,
            "body": null
        } : failedItems;
        return response;
    } catch (error) {
        console.log("caught error " + error.message);
        throw error;
    }
}
        