import { DeleteItemCommand, DynamoDBClient } from "@aws-sdk/client-dynamodb";

import { QueryCommand } from "@aws-sdk/lib-dynamodb";

const REGION = "eu-west-2";
const ddbClient = new DynamoDBClient({ region: REGION });

let query_params = { "KeyConditionExpression": "request_partition = :p AND begins_with(request_sort, :s)", "FilterExpression": "record_type = :t", "ExpressionAttributeValues": { ":p": "12345", ":s": "1678216759967db2f9-249e-494f-ba3a-060fb577bee9", ":t": "ROUTEPLAN" }, "TableName": "main-queuescaling-requestsTable" };
let data = await ddbClient.send(new QueryCommand(query_params));
console.log(JSON.stringify(data));
