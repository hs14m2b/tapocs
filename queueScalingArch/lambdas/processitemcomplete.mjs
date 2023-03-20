import { BatchWriteCommand, DynamoDBDocumentClient, PutCommand, QueryCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { COMPLETED, DDBVALIDATIONERRORS, DEFAULTEXPIRY, FAILED, REQBATCH, REQITEM, putItemWithConditionDDB, updateItemDDB } from "./constants.mjs";

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";

const REGION = "eu-west-2";
const ddbClient = new DynamoDBClient({ region: REGION });
const ddbDocClient = DynamoDBDocumentClient.from(ddbClient);
const REQUESTSTABLENAME = process.env['REQUESTSTABLENAME'];

let https;
try {
  https = await import('node:https');
} catch (err) {
  console.log('https support is disabled!');
}
function sleep(ms) {
    console.log("sleeping for " + ms + "ms");
    return new Promise((resolve) => { setTimeout(resolve, ms); });
}

async function getBatchItems(client_id, batch_id) {
    console.log("request partition is " + client_id);
    console.log("batch is " + batch_id);
    let queryParams = {
        KeyConditionExpression: "request_partition = :p AND begins_with(request_sort, :s)",
        FilterExpression: "record_type = :t1 OR record_type = :t2",
        ExpressionAttributeValues: {
            ":p": client_id,
            ":s": batch_id,
            ":t1": REQITEM,
            ":t2": REQBATCH
        },
        TableName: REQUESTSTABLENAME
    };
    console.log("params are " + JSON.stringify(queryParams));
    let data = await ddbDocClient.send(new QueryCommand(queryParams));
    console.log("got response");
    let batchItems = JSON.parse(JSON.stringify(data.Items));
    let moreItems = (data.LastEvaluatedKey) ? true : false;
    while (moreItems) {
        queryParams["ExclusiveStartKey"] = data.LastEvaluatedKey;
        data = await ddbDocClient.send(new QueryCommand(queryParams));
        batchItems = batchItems.concat(data.Items);
        moreItems = (data.LastEvaluatedKey) ? true : false;
    }
   return batchItems;
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
        //check that it is for a RequestItem
        if (!messageBody.record_type || !messageBody.record_type["S"] || messageBody.record_type["S"] != REQITEM) {
            console.log("not processing as not a REQITEM");
            continue;
        }
        //check that record_status is now "COMPLETED" or "FAILED"
        if (!messageBody.record_status || !messageBody.record_status["S"]
            || (messageBody.record_status["S"] != COMPLETED && messageBody.record_status["S"] != FAILED)) {
            console.log("not processing as record_status is not COMPLETED or FAILED");
            continue;
        }
        //check that old record_status was different"
        if (!oldMessageBody.record_status || !oldMessageBody.record_status["S"]
            || oldMessageBody.record_status["S"] == messageBody.record_status["S"]) {
            console.log("not processing as old record_status same as new record_status");
            continue;
        }
        //update the count on the batch item
        //get all the request items in the batch
        let request_partition = messageBody.request_partition["S"];
        let batch_id = messageBody.batch_id["S"];
        let update_fragment = "";
        if (messageBody.record_status["S"] == COMPLETED) {
            update_fragment = "SET completed_item_count = completed_item_count + :increment";
        }
        else
        {
            update_fragment = "SET failed_item_count = failed_item_count + :increment";
        }
        let updateParams = {
            "TableName": REQUESTSTABLENAME,
            "Key": {
                request_partition: request_partition,
                request_sort: batch_id + REQBATCH
            },
            "UpdateExpression": update_fragment,
            "ExpressionAttributeValues": {
                ":increment": 1
            },
            "ReturnValues": "ALL_NEW"
        };
        let updateData = null;
        try {
            updateData = await updateItemDDB(updateParams, ddbDocClient);
        } catch (error) {
            if (DDBVALIDATIONERRORS.includes(error.name))
            {
                console.log("caught database validation error - probably due to missing data from data clearout");
            }
            console.log("unable to increment batch count");
            continue;
        }
        let completed_item_count = updateData.Attributes.completed_item_count;
        let failed_item_count = updateData.Attributes.failed_item_count;
        let number_item = updateData.Attributes.number_item;
        
        let completedCount = completed_item_count;
        let failedCount = failed_item_count;
        let reqBatchItem = {};
        let batchSize = number_item;
        /*
        let batchItems = await getBatchItems(request_partition, batch_id);
        for (let batchItem of batchItems)
        {
            if (batchItem.record_type == REQBATCH)
            {
                reqBatchItem = batchItem;
                batchSize = batchItem.number_item;
            }
            else if (batchItem.record_type == REQITEM)
            {
                if (batchItem.record_status == COMPLETED) completedCount += 1;
                if (batchItem.record_status == FAILED) failedCount += 1;
            }
        }
        console.log("have looked at all items in batch. There are " + completedCount + " items completed and " + failedCount + " items failed out of a total of " + batchSize);
        */
        console.log("There are " + completedCount + " items completed and " + failedCount + " items failed out of a total of " + batchSize);
        if (batchSize == 0) continue;
        if (completedCount + failedCount == batchSize) {
            console.log("marking batch as " + COMPLETED)
            reqBatchItem.record_status = COMPLETED;
            let time_completed = parseInt((Date.now() / 1000).toString());
            try {
                let updateParams2 = {
                    "TableName": REQUESTSTABLENAME,
                    "Key": {
                        request_partition: request_partition,
                        request_sort: batch_id + REQBATCH
                    },
                    "UpdateExpression": "SET record_status = :status, time_completed  =:tc",
                    "ConditionExpression": "record_status <> :s",
                    "ExpressionAttributeValues": {
                        ":status": COMPLETED,
                        ":s": COMPLETED,
                        ":tc": time_completed 
                    },
                    "ReturnValues": "ALL_NEW"
                };
                try {
                    let updateResponse = await updateItemDDB(updateParams2, ddbDocClient);
                    console.log("have updated the batch request " + JSON.stringify(updateResponse));
                } catch (error) {
                    if (DDBVALIDATIONERRORS.includes(error.name))
                    {
                        console.log("caught database validation error - probably due to missing data from data clearout");
                    }
                    console.log("unable to update batch request");
                    continue;
                }
            } catch (error) {
                console.log("update of batch failed due to [" + error.message + "]");            
            }
        }
    }
    return;
}
