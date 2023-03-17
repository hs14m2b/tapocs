import { BatchWriteCommand, DynamoDBDocumentClient, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { DeleteItemCommand, DynamoDBClient } from "@aws-sdk/client-dynamodb";

const REGION = "eu-west-2";
const ddbClient = new DynamoDBClient({ region: REGION });
const ddbDocClient = DynamoDBDocumentClient.from(ddbClient);
const BATCHSIZE = 25;
async function deleteItemsDDB(items) {
    let params = {
        "RequestItems": {}
    };
    params.RequestItems["main-queuescaling-requestsTable"] = [];
    for (let item of items) {
        try {
            let requestDetails = {
                "DeleteRequest": {
                    "Key": item
                }
            };
            params.RequestItems["main-queuescaling-requestsTable"].push(requestDetails);
        } catch (error) {
            console.log("Caught error processing row " + item);
        }
    }
    const data = await ddbDocClient.send(new BatchWriteCommand(params));
    //console.log("Success - items deleted from", data);
    return data;
} 


let moreItems = true;
while (moreItems) {
    let deleteItems = [];
    let query_params = {
        TableName: "main-queuescaling-requestsTable",
        KeyConditionExpression: "request_partition = :r",
        ExpressionAttributeValues: { ":r": "12345" },
        ProjectionExpression: "request_partition, request_sort"
    }
    let data = await ddbClient.send(new QueryCommand(query_params));
    moreItems = (data.LastEvaluatedKey)? true: false;    
    console.log("No items returned = " + data.Items.length);
    console.log("more items is " + moreItems);
    let count = 0;
    for (let item of data.Items) {
        //console.log(JSON.stringify(item));
        deleteItems.push({
            "request_partition": item.request_partition,
            "request_sort": item.request_sort
        });
        if (deleteItems.length == BATCHSIZE)
        {
            await deleteItemsDDB(deleteItems);
            deleteItems = [];
            console.log("deleted a batch of " + BATCHSIZE + " items");
        }
    }
    if (deleteItems.length > 0)
    {
        await deleteItemsDDB(deleteItems);
        console.log("deleted a batch of " + deleteItems.length + " items");
    }
    //moreItems = false;
}