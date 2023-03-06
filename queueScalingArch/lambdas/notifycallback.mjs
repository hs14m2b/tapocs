import { DynamoDBDocumentClient, PutCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";

const REGION = "eu-west-2";
const ddbClient = new DynamoDBClient({ region: REGION });
const ddbDocClient = DynamoDBDocumentClient.from(ddbClient);
const REQUESTSTABLENAME = process.env['REQUESTSTABLENAME'];
const DEFAULTEXPIRY = 600;

function sleep(ms) {
    console.log("sleeping for " + ms + "ms");
    return new Promise((resolve) => { setTimeout(resolve, ms); });
}

async function updateItemDDB(params) {
    const data = await ddbDocClient.send(new UpdateCommand(params));
    console.log("Success - item updated", data);
    return data;
} 

async function putItemDDB(item) {
    let params = {
        "TableName": REQUESTSTABLENAME,
        "Item": item
    };
    const data = await ddbDocClient.send(new PutCommand(params));
    console.log("Success - item added to table", data);
    return data;
} 


export const handler = async (event) => {
    console.log(JSON.stringify(event));
    try {
        let body = JSON.parse(event.body);
        //"{\"id\": \"cdbb5ad6-60c9-48d3-bee2-a6bb82f50772\", \"reference\": \"12345.1678106342.fae747d6-29b7-406a-b036-c361b96664eb\", \"to\": \"matthewandkaren@hotmail.com\", \"status\": \"delivered\", \"created_at\": \"2023-03-06T12:39:15.351270Z\", \"completed_at\": \"2023-03-06T12:39:23.457754Z\", \"sent_at\": \"2023-03-06T12:39:15.494697Z\", \"notification_type\": \"email\", \"template_id\": \"b844408b-e85d-470d-9d56-49bbc20f282d\", \"template_version\": 1}"
        //reference is partition.sort
        let referenceParts = body.reference.split(".");
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
                ":s": body.status.toUpperCase()
            },
            "ReturnValues": "ALL_NEW"
        };
        let updateData = await updateItemDDB(updateParams);
        //adding callback info into ddb
        let callbackItem = {
            request_partition: request_partition,
            request_sort: request_sort.replace("ROUTEPLAN", "RPCALLBACK"),
            valid_until: (Date.now() / 1000) + DEFAULTEXPIRY,
            ...body
        }
        let insertData = await putItemDDB(callbackItem);
        console.log("have put callback item details into ddb");
        
    } catch (error) {
        console.log("caught error " + error.message);
    }
    let response = {
        "status": 200,
        "body": null
    }
    return response;
}