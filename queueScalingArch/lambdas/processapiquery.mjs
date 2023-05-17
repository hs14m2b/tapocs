import {
    ACCEPTED,
    DDBBATCHSIZE,
    DEFAULTEXPIRY,
    REQBATCH,
    REQITEM,
    REQSUBBATCH,
    getItemDDB,
    runQueryDDB,
    putItemDDB,
    putItemsDDB,
    putUnprocessedItemsDDB,
    updateItemDDB
} from "./constants.mjs";
import { BatchWriteCommand, DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";

const REGION = "eu-west-2";
const REQUESTSTABLENAME = process.env['REQUESTSTABLENAME'];
const ddbClient = new DynamoDBClient({ region: REGION });
const ddbDocClient = DynamoDBDocumentClient.from(ddbClient);

function sleep(ms) {
    console.log("sleeping for " + ms + "ms");
    return new Promise((resolve) => { setTimeout(resolve, ms); });
}

export const handler = async (event) => {
    console.log(JSON.stringify(event));
    console.log("Starting to process request at " + (Date.now()/1000));
    try {
        //check this is a GET request
        let request_method = event.httpMethod;
        if (request_method != "GET"){
            return {
                "statusCode": 400,
                "body": "Invalid request method"
            };
        }
        let path_param = event.pathParameters.pathparam;
        if (path_param.indexOf("/") > -1){
            return await getBatch(event);
        }
        else
        {
            return await getBatches(event);
        }
    } catch (error) {
        console.log("caught error " + error.message);
        let final_response = {
            "statusCode": 500,
            "headers": {
                "Content-Type": "application/json"
            },
            "body": JSON.stringify({"error": error.message})
        };
        return final_response;
    }
}

async function getBatch(event){
    let path_param = event.pathParameters.pathparam;
    let clientId = path_param.split("/")[0];
    let batchId = path_param.split("/")[1];
    console.log("client id is " + clientId + " and batch id is " + batchId);
    let key = {
        request_partition: clientId,
        request_sort: batchId + REQBATCH,
    };
    let batch_item = (await getItemDDB(key, REQUESTSTABLENAME, ddbDocClient)).Item;
    batch_item = (batch_item == undefined) ? {}: batch_item;
    console.log("batch_item is " + JSON.stringify(batch_item));
    let final_response = {
        "statusCode": 200,
        "headers": {
            "Content-Type": "application/json"
        },
        "body": JSON.stringify(batch_item)
    };
    return final_response;
} 

async function getBatches(event){
    let path_param = event.pathParameters.pathparam;
    let clientId = path_param;
    console.log("client id is " + clientId);
    let queryParams = {
        KeyConditionExpression: "request_partition = :rp",
        FilterExpression: "record_type = :rt1",
        ExpressionAttributeValues: {
            ":rp": clientId,
            ":rt1": REQBATCH
        },
        TableName: REQUESTSTABLENAME
    };
    let data = await runQueryDDB(queryParams, ddbDocClient);
    let final_response = {
        "statusCode": 200,
        "headers": {
            "Content-Type": "application/json"
        },
        "body": JSON.stringify(data)
    };
    return final_response;
} 