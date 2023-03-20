import { BatchWriteCommand, DynamoDBDocumentClient, PutCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { DEFAULTEXPIRY, DELIVERED, putItemDDB, putItemsDDB, putUnprocessedItemsDDB, runQueryDDB, updateItemDDB } from "./constants.mjs";
import { SQSClient, SendMessageBatchCommand, SendMessageCommand } from "@aws-sdk/client-sqs";

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { NotifyClient } from "notifications-node-client";

const REGION = "eu-west-2";
const ddbClient = new DynamoDBClient({ region: REGION });
const ddbDocClient = DynamoDBDocumentClient.from(ddbClient);
const REQUESTSTABLENAME = process.env['REQUESTSTABLENAME'];
const client = new SQSClient();
const BATCHSIZE = 0;


function sleep(ms) {
    console.log("sleeping for " + ms + "ms");
    return new Promise((resolve) => { setTimeout(resolve, ms); });
}

async function getRequestItems(client_id, batch_id, request_id) {
    console.log("request partition is " + client_id);
    console.log("batch is " + batch_id);
    console.log("request_id is " + request_id);
    let queryParams = {
        KeyConditionExpression: "request_partition = :p AND begins_with(request_sort, :s)",
        ExpressionAttributeValues: {
            ":p": client_id,
            ":s": batch_id + request_id
        },
        TableName: REQUESTSTABLENAME
    };
    console.log("params are " + JSON.stringify(queryParams));
    let data = await runQueryDDB(queryParams, ddbDocClient);
    console.log("got response");
    return data;
}



export const handler = async (event) => {
    console.log(JSON.stringify(event));
    let failedItems = {
        "batchItemFailures": []
    }
    let items = [];
    for (let i = 0; i < event.Records.length; i++) {
        console.log("Processing item " + (i + 1));
        //check that this is an SMS
        if (event.Records[i].eventSource != "aws:sqs") {
            console.log("not processing this item as not received from SQS!");
            continue;
        }
        let itemIdentifier = event.Records[i].messageId;
        try {
            let messageBody = JSON.parse(event.Records[i].body);

            let referenceParts = messageBody.reference.split(".");
            let request_partition = referenceParts[0];
            let request_sort = referenceParts[1];
            let updateParams = {
                "TableName": REQUESTSTABLENAME,
                "Key": {
                    request_partition: request_partition,
                    request_sort: request_sort
                },
                "UpdateExpression": "set record_status = :s",
                "ExpressionAttributeValues": {
                    ":s": messageBody.status.toUpperCase()
                },
                "ReturnValues": "ALL_NEW"
            };
            let updateData = await updateItemDDB(updateParams, ddbDocClient);
            let batch_id = updateData.Attributes.batch_id;
            let request_id = updateData.Attributes.request_id;
            //adding callback info into ddb
            let callbackItem = {
                request_partition: request_partition,
                request_sort: request_sort.replace("ROUTEPLAN", "RPCALLBACK"),
                valid_until: parseInt((Date.now() / 1000).toString()) + DEFAULTEXPIRY,
                time_received: parseInt((Date.now() / 1000).toString()),
                date_received: parseInt(new Date().toISOString().substring(0, 10).replace("-", "")),
                record_type: "RPCALLBACK",
                batch_id: batch_id,
                request_id: request_id,
                ...messageBody
            }
            let insertData = await putItemDDB(callbackItem, REQUESTSTABLENAME, ddbDocClient);
            console.log("have put callback item details into ddb");
            //check the status
            if (messageBody.status.toUpperCase() != DELIVERED) {
                //delivered, permanent-failure, temporary-failure or technical-failure
                console.log("somehow a non-delivered message has been passed....");
                continue;
            }
            else {
                //get all the other routing plans and set status to "NOTREQUIRED"
                console.log("getting routing plans");
                let requestItems = await getRequestItems(request_partition, batch_id, request_id);
                console.log("got the routing plans");
                console.log(JSON.stringify(requestItems));
                let updatedItems = [];
                for (let requestItem of requestItems) {
                    console.log(JSON.stringify(requestItem));
                    if (requestItem.record_status == "PENDING" && requestItem.record_type == "ROUTEPLAN") {
                        updatedItems.push({
                            ...requestItem,
                            record_status: "NOTREQUIRED"
                        })
                    }
                    if (requestItem.record_status == "ENRICHED" && requestItem.record_type == "REQITEM") {
                        updatedItems.push({
                            ...requestItem,
                            record_status: "COMPLETED",
                            completed_time: (Date.now() / 1000)
                        })
                    }
                }
                console.log(JSON.stringify(updatedItems));
                if (updatedItems.length > 0) {
                    let data = await putItemsDDB(updatedItems, REQUESTSTABLENAME, ddbDocClient);
                    while (data.UnprocessedItems[REQUESTSTABLENAME] &&
                        data.UnprocessedItems[REQUESTSTABLENAME].length > 0) {
                        console.log("THERE ARE UNPROCESSED ITEMS - COUNT IS " + data.UnprocessedItems[REQUESTSTABLENAME].length);
                        data = await putUnprocessedItemsDDB(data.UnprocessedItems[REQUESTSTABLENAME], REQUESTSTABLENAME, ddbDocClient);
                    }
                }
            }
        } catch (error) {
            let failedItem = {
                "itemIdentifier": itemIdentifier
            };
            failedItems.batchItemFailures.push(failedItem);
            console.log("failed to process SQS record ", error.name, error.message);
        }
    }
    return failedItems;
}