import { BatchWriteCommand, DynamoDBDocumentClient, PutCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import {
    ALLNEW,
    COMPLETED,
    DEFAULTEXPIRY,
    DELIVERED,
    ENRICHED,
    NOTREQUIRED,
    PENDING,
    REQITEM,
    REQSUBBATCH,
    ROUTEPLAN,
    RPCALLBACK,
    putItemDDB,
    putItemsDDB,
    putUnprocessedItemsDDB,
    runQueryDDB,
    updateItemDDB,
    transactWriteItemsDDB
} from "./constants.mjs";

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";

const REGION = "eu-west-2";
const ddbClient = new DynamoDBClient({ region: REGION });
const ddbDocClient = DynamoDBDocumentClient.from(ddbClient);
const REQUESTSTABLENAME = process.env['REQUESTSTABLENAME'];
const PROCESSINGMETRICSTABLENAME = process.env['PROCESSINGMETRICSTABLENAME'];
const BATCHSIZE = 0;


function sleep(ms) {
    console.log("sleeping for " + ms + "ms");
    return new Promise((resolve) => { setTimeout(resolve, ms); });
}

async function getRequestItems(request_partition, request_id) {
    console.log("request partition is " + request_partition);
    console.log("request_id is " + request_id);
    let queryParams = {
        KeyConditionExpression: "request_partition = :p AND begins_with(request_sort, :s)",
        ExpressionAttributeValues: {
            ":p": request_partition,
            ":s": request_id
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
            //request id is the request_sort without last 12 chars
            let request_id = request_sort.substring(0,request_sort.length-12);
            console.log("request id is ",request_id);
            let time_completed = parseInt((Date.now() / 1000).toString());
            let date_completed = parseInt(new Date().toISOString().substring(0,10).replace(/-/g, ""));
            let updateItems = [
                {
                    "Update": {
                        "Key": {
                            request_partition: {"S": request_partition},
                            request_sort: {"S": request_sort}
                        },
                        "UpdateExpression": "set record_status = :s, time_completed  =:tc, date_completed = :dc",
                        "TableName": REQUESTSTABLENAME,
                        "ExpressionAttributeValues": {
                            ":s": {"S": messageBody.status.toUpperCase()},
                            ":tc": {"N": time_completed.toString()},
                            ":dc": {"N": date_completed.toString()}
                        }
                    }
                },
                {
                    "Update": {
                        "Key": {
                            request_partition: {"S": request_partition},
                            request_sort: {"S": REQSUBBATCH}
                        },
                        "UpdateExpression": "SET completed_item_count = completed_item_count + :increment",
                        "TableName": REQUESTSTABLENAME,
                        "ExpressionAttributeValues": {
                            ":increment": {"N": "1"}
                        }
                    }
                }
            ];

            //get all the other routing plans and set status to "NOTREQUIRED"
            console.log("getting routing plans");
            let requestItems = await getRequestItems(request_partition, request_id);
            console.log("got the routing plans");
            console.log(JSON.stringify(requestItems));
            let reqItem = false;
            let batch_id = "";//updateData.Attributes.batch_id;
            //let request_id = updateData.Attributes.request_id;
            let sub_batch_no = "";//updateData.Attributes.sub_batch_no;
            for (let requestItem of requestItems) {
                console.log(JSON.stringify(requestItem));
                if (requestItem.record_status == PENDING && requestItem.record_type == ROUTEPLAN) {
                    let updateRP = {"Update": {
                        "TableName": REQUESTSTABLENAME,
                        "Key": {
                            request_partition: {"S": requestItem.request_partition},
                            request_sort: {"S": requestItem.request_sort}
                        },
                        "UpdateExpression": "SET record_status = :rs",
                        "ExpressionAttributeValues": {
                            ":rs": {"S": NOTREQUIRED}
                        }
                    }};
                    updateItems.push(updateRP);
                }
                if (requestItem.record_type == REQITEM) {
                    batch_id = requestItem.batch_id;
                    request_id = requestItem.request_id;
                    sub_batch_no = requestItem.sub_batch_no;
                    if (requestItem.record_status == ENRICHED )
                    {
                        let updateRI = {"Update": {
                            "TableName": REQUESTSTABLENAME,
                            "Key": {
                                request_partition: {"S": requestItem.request_partition},
                                request_sort: {"S": requestItem.request_sort}
                            },
                            "UpdateExpression": "SET record_status = :rs, completed_time = :ct",
                            "ExpressionAttributeValues": {
                                ":rs": {"S": COMPLETED},
                                ":ct": {"N": parseInt((Date.now() / 1000).toString()).toString()}
                            }
                        }};
                        updateItems.push(updateRI);
                    }
                }
            }
            let updateData = await transactWriteItemsDDB(updateItems, ddbClient);
            //adding callback info into ddb
            let callbackItem = {
                request_partition: request_partition,
                request_sort: request_sort.replace(ROUTEPLAN, RPCALLBACK),
                valid_until: parseInt((Date.now() / 1000).toString()) + DEFAULTEXPIRY,
                time_received: parseInt((Date.now() / 1000).toString()),
                date_received: parseInt(new Date().toISOString().substring(0, 10).replace("-", "")),
                record_type: RPCALLBACK,
                batch_id: batch_id,
                request_id: request_id,
                sub_batch_no: sub_batch_no,
                ...messageBody
            }
            let insertData = await putItemDDB(callbackItem, PROCESSINGMETRICSTABLENAME, ddbDocClient);
            console.log("have put callback item details into processing metrics ddb");
            //check the status
            if (messageBody.status.toUpperCase() != DELIVERED) {
                //delivered, permanent-failure, temporary-failure or technical-failure
                console.log("somehow a non-delivered message has been passed....");
                continue;
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