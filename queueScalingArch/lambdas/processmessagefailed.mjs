import {
    ACTIVE,
    DEFAULTEXPIRY,
    DELIVERED,
    FAILED,
    NOTREQUIRED,
    PENDING,
    REQITEM,
    ROUTEPLAN,
    SENT,
    TEMPORARY_FAILURE
} from "./constants.mjs";
import { BatchWriteCommand, DynamoDBDocumentClient, PutCommand, QueryCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { SQSClient, SendMessageBatchCommand, SendMessageCommand } from "@aws-sdk/client-sqs";
import { putItemWithConditionDDB, runQueryDDB, updateItemDDB } from "./constants.mjs";

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";

const REGION = "eu-west-2";
const ddbClient = new DynamoDBClient({ region: REGION });
const ddbDocClient = DynamoDBDocumentClient.from(ddbClient);
const REQUESTSTABLENAME = process.env['REQUESTSTABLENAME'];
const PROCESSINGMETRICSTABLENAME = process.env['PROCESSINGMETRICSTABLENAME'];
const SMSDELIVERYQUEUEURL = process.env['SMSDELIVERYQUEUEURL'];
const EMAILDELIVERYQUEUEURL = process.env['EMAILDELIVERYQUEUEURL'];
const FINISHEDQUEUEURL = process.env['FINISHEDQUEUEURL'];
const sqsClient = new SQSClient();


function sleep(ms) {
    console.log("sleeping for " + ms + "ms");
    return new Promise((resolve) => { setTimeout(resolve, ms); });
}

async function updateRequestItem(request_partition, request_id) {
    let updateParams = {
        "TableName": REQUESTSTABLENAME,
        "Key": {
            request_partition: request_partition,
            request_sort: request_id + REQITEM
        },
        "UpdateExpression": "set record_status = :rs",
        "ExpressionAttributeValues": {
            ":rs": FAILED
        },
        "ReturnValues": "ALL_NEW"
    };

    try {
        const data = await updateItemDDB(updateParams, ddbDocClient);
        console.log("Success - item updated", data);
        //publish item to SQS
        let sqsParams = {
            DelaySeconds: 0,
            MessageBody: JSON.stringify(data.Attributes),
            QueueUrl: FINISHEDQUEUEURL
        }
        const response = await sqsClient.send(new SendMessageCommand(sqsParams));
        console.log(JSON.stringify(response));
        return data;
    } catch (error) {
        console.log("Failed to update request item ", error.name, error.message);
        throw error;
    }
} 

async function getNextRoutePlan(request_partition, request_id, plan_sequence) {
    console.log("request partition is " + request_partition);
    console.log("request_id is " + request_id);
    console.log("plan_sequence is " + plan_sequence);
    let queryParams = {
        KeyConditionExpression: "request_partition = :p AND begins_with(request_sort, :s)",
        FilterExpression: "plan_sequence = :ps",
        ExpressionAttributeValues: {
            ":p": request_partition,
            ":s": request_id,
            ":ps": plan_sequence + 1
        },
        TableName: REQUESTSTABLENAME
    };
    console.log("params are " + JSON.stringify(queryParams));

    try {
        let data = await runQueryDDB(queryParams, ddbDocClient);
        console.log("got response");
        return data;
    } catch (error) {
        console.log("Failed to run query ", error.name, error.message);
        throw error;
    }
}


async function updateRoutePlan(item) {
    let params = {
        "TableName": REQUESTSTABLENAME,
        "Item": item,
        "ConditionExpression": "record_status <> :s",
        "ExpressionAttributeValues": {
            ":s": ACTIVE
        }
    };
    console.log("params are " + JSON.stringify(params));
    try {
        const data = await putItemWithConditionDDB(params, ddbDocClient);
        console.log("Success - item updated", data);
        return data;
    } catch (error) {
        console.log("Failed to update item ", error.name, error.message);
        throw error;
    }
} 



export const handler = async (event) => {
    console.log(JSON.stringify(event));
    let failedItems = {
        "batchItemFailures": []
    }
    let items = [];
    for (let i = 0; i < event.Records.length; i++) {
        console.log("Processing item " + (i + 1));
        if (event.Records[i].eventSource != "aws:sqs") {
            console.log("not processing this item as not received from SQS!");
            continue;
        }
        let itemIdentifier = event.Records[i].messageId;
        try {
            let messageBody = JSON.parse(event.Records[i].body);
            //check that record_status is not now DELIVERED or TEMPORARY-FAILURE or SENT or ACTIVE or PENDINg permanent-failure, temporary-failure or technical-failure
            if (!messageBody.status
                || messageBody.status.toUpperCase() == DELIVERED
                || messageBody.status.toUpperCase() == SENT
                || messageBody.status.toUpperCase() == ACTIVE
                || messageBody.status.toUpperCase() == PENDING
                || messageBody.status.toUpperCase() == NOTREQUIRED
                || messageBody.status.toUpperCase() == TEMPORARY_FAILURE) {
                console.log("not processing as status is now DELIVERED or TEMPORARY-FAILURE or SENT or ACTIVE or PENDING");
                continue;
            }
            //get all the route plans in the item
            let referenceParts = messageBody.reference.split(".");
            let request_partition = referenceParts[0];
            let request_sort = referenceParts[1];
            //update the status of the item
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
            let sub_batch_no = updateData.Attributes.sub_batch_no;
            let request_id = updateData.Attributes.request_id;
            let plan_sequence = parseInt(updateData.Attributes.plan_sequence);
            let requestItems = await getNextRoutePlan(request_partition, request_id, plan_sequence);
            if (requestItems.length == 0) {
                console.log("there are no more ROUTEPLANs - marking REQITEM as FAILED");
                let updateData = await updateRequestItem(request_partition, request_id);
                console.log("have updated the request item to FAILED " + JSON.stringify(updateData));
            }
            else
            {
                let nextRoutePlan = requestItems[0];
                nextRoutePlan.record_status = ACTIVE;
                let updateResponse = await updateRoutePlan(nextRoutePlan);
                //publish the event to the "email or SMS delivery" queue
                let sqsParams = {
                    DelaySeconds: 0,
                    MessageAttributes: {
                        "channel": {
                            "DataType": "String",
                            "StringValue": nextRoutePlan.channel
                        }
                    },
                    MessageBody: JSON.stringify(nextRoutePlan),
                    QueueUrl: (nextRoutePlan.channel == "SMS") ? SMSDELIVERYQUEUEURL : EMAILDELIVERYQUEUEURL
                }
                const response = await sqsClient.send(new SendMessageCommand(sqsParams));
                console.log(JSON.stringify(response));
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