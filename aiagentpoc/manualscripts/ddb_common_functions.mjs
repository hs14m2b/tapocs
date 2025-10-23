import { BatchWriteCommand, PutCommand, QueryCommand, UpdateCommand, GetCommand, DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { v4 as uuidv4 } from 'uuid';
import {
  SNSClient,
  PublishCommand
} from "@aws-sdk/client-sns";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
const REGION = "eu-west-2";
const ddbClient = new DynamoDBClient({ region: REGION });
const ddbDocClient = DynamoDBDocumentClient.from(ddbClient);
const DDBSCALINGERRORS = ["ThrottlingException",
    "ProvisionedThroughputExceededException",
    "ProvisionedThroughputExceeded",
    "RequestLimitExceeded",
    "LimitExceededException"];

function sleep(ms) {
    console.log("sleeping for " + ms + "ms");
    return new Promise((resolve) => { setTimeout(resolve, ms); });
}

const putItemDDB = async (item, tableName) => {
    let params = {
        "TableName": tableName,
        "Item": item
    };
    let in_error = true;
    let iteration = 0;
    while (in_error)
    {
        iteration += 1;
        try {
            const data = await ddbDocClient.send(new PutCommand(params));
            console.log("Success - item added to table", data);
            in_error = false;
            return data;
        }
        catch (error) {
            console.log("Failed - item NOT updated to table", error.name, error.message);
            if (DDBSCALINGERRORS.includes(error.name)) {
                console.log("this is a scaling error so backing off for 1 second")
                await sleep(1000 * iteration);
            }
            else {
                console.log("not a scaling error so throwing exception");
                throw error;
            }
        }
    }
}

const getItemDDB = async (key, tableName) => {
    let params = {
        "TableName": tableName,
        "Key": key
    };
    console.log("getItemDDB params are " + JSON.stringify(params));
    let in_error = true;
    let iteration = 0;
    while (in_error)
    {
        iteration += 1;
        try {
            const data = await ddbDocClient.send(new GetCommand(params));
            console.log("Success - item retrieved", data);
            in_error = false;
            return data;
        } catch (error) {
            console.log("Failed - item NOT retrieved", error.name, error.message);
            if (DDBSCALINGERRORS.includes(error.name)) {
                console.log("this is a scaling error so backing off for 1 second")
                await sleep(1000 * iteration);
            }
            else {
                console.log("not a scaling error so throwing exception");
                throw error;
            }
        }
        
    }
} 


export class ddbCommonFunctionObject{
  constructor(){
    this.putItemDDB = putItemDDB;
    this.getItemDDB = getItemDDB;
  }
}
