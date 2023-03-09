import { ACTIVE, DEFAULTEXPIRY, DELIVERED, FAILED, NOTREQUIRED, PENDING, REQITEM, ROUTEPLAN, SENT, TEMPORARY_FAILURE } from "./constants.mjs";
import { BatchWriteCommand, DynamoDBDocumentClient, PutCommand, QueryCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { SQSClient, SendMessageBatchCommand, SendMessageCommand } from "@aws-sdk/client-sqs";

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";

const REGION = "eu-west-2";
const ddbClient = new DynamoDBClient({ region: REGION });
const ddbDocClient = DynamoDBDocumentClient.from(ddbClient);
const REQUESTSTABLENAME = process.env['REQUESTSTABLENAME'];
const SMSDELIVERYQUEUEURL = process.env['SMSDELIVERYQUEUEURL'];
const EMAILDELIVERYQUEUEURL = process.env['EMAILDELIVERYQUEUEURL'];
const sqsClient = new SQSClient();

function sleep(ms) {
    console.log("sleeping for " + ms + "ms");
    return new Promise((resolve) => { setTimeout(resolve, ms); });
}

async function updateRequestItem(request_partition, batch_id, request_id) {
    let updateParams = {
        "TableName": REQUESTSTABLENAME,
        "Key": {
            request_partition: request_partition,
            request_sort: batch_id + request_id + REQITEM
        },
        "UpdateExpression": "set record_status = :rs",
        "ExpressionAttributeValues": {
            ":rs": FAILED
        },
        "ReturnValues": "ALL_NEW"
    };

    const data = await ddbDocClient.send(new UpdateCommand(updateParams));
    console.log("Success - item updated", data);
    return data;
} 

async function getRequestItems(client_id, batch_id, request_id, plan_sequence) {
    console.log("request partition is " + client_id);
    console.log("batch is " + batch_id);
    console.log("request_id is " + request_id);
    console.log("plan_sequence is " + plan_sequence);
    let queryParams = {
        KeyConditionExpression: "request_partition = :p AND begins_with(request_sort, :s)",
        FilterExpression: "plan_sequence = :ps",
        ExpressionAttributeValues: {
            ":p": client_id,
            ":s": batch_id + request_id,
            ":ps": plan_sequence + 1
        },
        TableName: REQUESTSTABLENAME
    };
    console.log("params are " + JSON.stringify(queryParams));
    let data = await ddbDocClient.send(new QueryCommand(queryParams));
    console.log("got response");
    return data.Items;
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
    const data = await ddbDocClient.send(new PutCommand(params));
    console.log("Success - item updated", data);
    return data;
} 


export const handler = async (event) => {
    console.log(JSON.stringify(event));
    let items = [];
    for (let i = 0; i < event.Records.length; i++)
    {
        console.log("Processing item " + (i + 1));
        //check that this is an update
        if (event.Records[i].eventName != "MODIFY") {
            console.log("not processing this item as not an update");
            continue;
        }
        let messageBody = event.Records[i].dynamodb.NewImage
        let oldMessageBody = event.Records[i].dynamodb.OldImage
        //check that it is for a route plan
        if (!messageBody.record_type || !messageBody.record_type["S"] || messageBody.record_type["S"] != ROUTEPLAN) {
            console.log("not processing as not a ROUTEPLAN");
            continue;
        }
        //check that record_status is not now DELIVERED or TEMPORARY-FAILURE or SENT or ACTIVE or PENDINg permanent-failure, temporary-failure or technical-failure
        if (!messageBody.record_status || !messageBody.record_status["S"]
            || messageBody.record_status["S"].toUpperCase() == DELIVERED
            || messageBody.record_status["S"].toUpperCase() == SENT
            || messageBody.record_status["S"].toUpperCase() == ACTIVE
            || messageBody.record_status["S"].toUpperCase() == PENDING
            || messageBody.record_status["S"].toUpperCase() == NOTREQUIRED
            || messageBody.record_status["S"].toUpperCase() == TEMPORARY_FAILURE) {
            console.log("not processing as record_status is now DELIVERED or TEMPORARY-FAILURE or SENT or ACTIVE or PENDING");
            continue;
        }
        //check that old record_status does not match new record_status
        if (!oldMessageBody.record_status || !oldMessageBody.record_status["S"] || oldMessageBody.record_status["S"] == messageBody.record_status["S"]) {
            console.log("not processing as old record_status matches new record_status");
            continue;
        }
        //get all the route plans in the item
        let request_partition = messageBody.request_partition["S"];
        let batch_id = messageBody.batch_id["S"];
        let request_id = messageBody.request_id["S"];
        let plan_sequence = parseInt(messageBody.plan_sequence["N"]);
        let requestItems = await getRequestItems(request_partition, batch_id, request_id, plan_sequence);
        if (requestItems.length == 0) {
            console.log("there are no more ROUTEPLANs - marking REQITEM as FAILED");
            let updateData = await updateRequestItem(request_partition, batch_id, request_id);
            console.log("have updated the request item to FAILED " + JSON.stringify(updateData));
        }
        else
        {
            let nextRoutePlan = requestItems[0];
            nextRoutePlan.record_status = ACTIVE;
            let updateResponse = await updateRoutePlan(nextRoutePlan);
            //publish the event to the "send requests" queue
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
    }
    return;
}
