import { DeleteItemCommand, DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand } from "@aws-sdk/lib-dynamodb";

const REGION = "eu-west-2";
const ddbClient = new DynamoDBClient({ region: REGION });

let moreItems = true;
while (moreItems) {
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
        let delete_params = {
            TableName: "main-queuescaling-requestsTable",
            Key: {
                "request_partition": { "S": item.request_partition },
                "request_sort": { "S": item.request_sort }
            }
        }
        //console.log(JSON.stringify(delete_params));
        let data2 = await ddbClient.send(new DeleteItemCommand(delete_params));
        count += 1;
        if (count % 100 == 0) console.log("No items deleted = " + count);
    }
}