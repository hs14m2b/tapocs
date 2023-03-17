import { BatchWriteCommand, DynamoDBDocumentClient, PutCommand, QueryCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";

import { DEFAULTEXPIRY } from "./constants.mjs";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";

const REGION = "eu-west-2";
const ddbClient = new DynamoDBClient({ region: REGION });
const ddbDocClient = DynamoDBDocumentClient.from(ddbClient);
const REQUESTSTABLENAME = process.env['REQUESTSTABLENAME'];

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
    let data = await ddbDocClient.send(new QueryCommand(queryParams));
    console.log("got response");
    return data.Items;
}

async function putItemsDDB(items) {
    let params = {
        "RequestItems": {}
    };
    params.RequestItems[REQUESTSTABLENAME] = [];
    for (let item of items) {
        try {
            let requestDetails ={ "PutRequest": {"Item": item}}
            params.RequestItems[REQUESTSTABLENAME].push(requestDetails);
        } catch (error) {
            console.log("Caught error processing row " + item);
        }
    }
    const data = await ddbDocClient.send(new BatchWriteCommand(params));
    console.log("Success - items added/updated to table", data);
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
        console.log(JSON.stringify(updateData.Attributes));
        let batch_id = updateData.Attributes.batch_id;
        let request_id = updateData.Attributes.request_id;
        //adding callback info into ddb
        let callbackItem = {
            request_partition: request_partition,
            request_sort: request_sort.replace("ROUTEPLAN", "RPCALLBACK"),
            valid_until: (Date.now() / 1000) + DEFAULTEXPIRY,
            time_received: Date.now() / 1000,
            date_received: parseInt(new Date().toISOString().substring(0, 10).replace("-", "")),
            record_type: "RPCALLBACK",
            batch_id: batch_id,
            request_id: request_id,
            ...body
        }
        let insertData = await putItemDDB(callbackItem);
        console.log("have put callback item details into ddb");
        //check the status
        if (body.status.toUpperCase() != "DELIVERED")
        {
            //delivered, permanent-failure, temporary-failure or technical-failure
        }
        else
        {
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
                        record_status:"NOTREQUIRED"
                    })
                }
                if (requestItem.record_status == "ENRICHED" && requestItem.record_type == "REQITEM") {
                    updatedItems.push({
                        ...requestItem,
                        record_status: "COMPLETED",
                        completed_time: (Date.now()/1000)
                    })
                }
            }
            console.log(JSON.stringify(updatedItems));
            if (updatedItems.length > 0) await putItemsDDB(updatedItems);
        }
        
    } catch (error) {
        console.log("caught error " + error.message);
        throw error;
    }
    let response = {
        "status": 200,
        "body": null
    }
    return response;
}