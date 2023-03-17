import { ACCEPTED, COMPLETED, ENRICHED, FAILED } from "../../lambdas/constants.mjs";
import { DeleteItemCommand, DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand } from "@aws-sdk/lib-dynamodb";

const REGION = "eu-west-2";
const ddbClient = new DynamoDBClient({ region: REGION });
const ddbDocClient = DynamoDBDocumentClient.from(ddbClient);

let query_params = {
    TableName: "main-queuescaling-requestsTable",
    IndexName: "main-queuescaling-requestsTable-datereceivedGSI",
    KeyConditionExpression: "record_type = :rt AND date_received = :dr",
    ExpressionAttributeValues: {
        ":rt": "REQBATCH",
        ":dr": parseInt(new Date().toISOString().substring(0,10).replace("-", ""))
    }
}
console.log("query params are " + JSON.stringify(query_params));
let data = await ddbDocClient.send(new QueryCommand(query_params));
console.log(JSON.stringify(data));
console.log("No batches returned = " + data.Items.length);
let batchesArray = JSON.parse(JSON.stringify(data.Items));
batchesArray.sort((a, b) => a.time_received > b.time_received ? -1 : 1);
console.log("batches from most recent as follows ");
for (let batch of batchesArray) {
    console.log("Batch ID [" + batch.batch_id + "] received at [" + new Date(batch.time_received * 1000).toISOString() + "] with status [" + batch.record_status + "]" );
}
//for (let batch of batchesArray) {
query_params = {
    TableName: "main-queuescaling-requestsTable",
    KeyConditionExpression: "request_partition = :rp AND request_sort = :rs",
    ExpressionAttributeValues: {
        ":rp": batchesArray[0].client_id,
        ":rs": batchesArray[0].batch_id + "REQBATCH"
    }
}
//console.log("query params are " + JSON.stringify(query_params));
data = await ddbDocClient.send(new QueryCommand(query_params));
//console.log(JSON.stringify(data));

let totalNo = 0;
let batch = JSON.parse(JSON.stringify(data.Items[0]));
    console.log("checking details for batch [" + batch.batch_id + "]");
    let batch_query_params = {
        TableName: "main-queuescaling-requestsTable",
        KeyConditionExpression: "request_partition = :r AND begins_with(request_sort, :rs)",
        FilterExpression: "record_type = :rt",
        ExpressionAttributeValues: {
            ":r": "12345",
            ":rs": batch.batch_id,
            ":rt": "REQITEM"
        },
        Select: "COUNT"
    }
//        ProjectionExpression: "request_partition, request_sort, time_received, record_status, batch_id, request_id"
let data2 = await ddbDocClient.send(new QueryCommand(batch_query_params));
//console.log(JSON.stringify(data2));
totalNo += data2.Count;
let moreItems = (data2.LastEvaluatedKey) ? true : false;
//console.log("more items is " + moreItems);
while (moreItems) {
    batch_query_params = {
        TableName: "main-queuescaling-requestsTable",
        KeyConditionExpression: "request_partition = :r AND begins_with(request_sort, :rs)",
        FilterExpression: "record_type = :rt",
        ExpressionAttributeValues: {
            ":r": "12345",
            ":rs": batch.batch_id,
            ":rt": "REQITEM"
        },
        Select: "COUNT",
        ExclusiveStartKey: data2.LastEvaluatedKey
    }
    data2 = await ddbDocClient.send(new QueryCommand(batch_query_params));
    //console.log(JSON.stringify(data2));
    totalNo += data2.Count;
    moreItems = (data2.LastEvaluatedKey) ? true : false;
}
    console.log("No items returned = " + totalNo);
    batch_query_params = {
        TableName: "main-queuescaling-requestsTable",
        KeyConditionExpression: "request_partition = :r AND begins_with(request_sort, :rs)",
        FilterExpression: "record_type = :rt",
        ExpressionAttributeValues: {
            ":r": "12345",
            ":rs": batch.batch_id,
            ":rt": "REQITEM"
        }
    }
    data2 = await ddbDocClient.send(new QueryCommand(batch_query_params));
let itemsData = JSON.parse(JSON.stringify(data2.Items));
    moreItems = (data2.LastEvaluatedKey) ? true : false;
console.log("more items is " + moreItems);
console.log("item count so far is " + itemsData.length);
while (moreItems) {
    batch_query_params = {
        TableName: "main-queuescaling-requestsTable",
        KeyConditionExpression: "request_partition = :r AND begins_with(request_sort, :rs)",
        FilterExpression: "record_type = :rt",
        ExpressionAttributeValues: {
            ":r": "12345",
            ":rs": batch.batch_id,
            ":rt": "REQITEM"
        },
        ExclusiveStartKey: data2.LastEvaluatedKey
    }
    data2 = await ddbDocClient.send(new QueryCommand(batch_query_params));
    moreItems = (data2.LastEvaluatedKey) ? true : false;
console.log("more items is " + moreItems);
    itemsData = itemsData.concat(data2.Items);
console.log("additional items count is " + data2.Items.length);
}
console.log("total items to iterate is " + itemsData.length);
let success_count = 0;
    let failed_count = 0;
    let accepted_count = 0;
    let enriched_count = 0;
    for (let item of itemsData) {
        //console.log("record status is [" + item.record_status + "]");
        if (item.record_status == COMPLETED) success_count += 1;
        if (item.record_status == FAILED) failed_count += 1;
        if (item.record_status == ACCEPTED) accepted_count += 1;
        if (item.record_status == ENRICHED) enriched_count += 1;
        if (item.record_status != COMPLETED &&
            item.record_status != FAILED &&
            item.record_status != ACCEPTED &&
            item.record_status != ENRICHED
        ) console.log("item is [" + JSON.stringify(item) + "]\n");
    }
    batch["success_count"] = success_count;
    batch["failed_count"] = failed_count;
    batch["accepted_count"] = accepted_count;
    batch["enriched_count"] = enriched_count;
    console.log("Batch details are " + JSON.stringify(batch));
//}
//console.log("all batch details are " + JSON.stringify(batchesArray,null,4));