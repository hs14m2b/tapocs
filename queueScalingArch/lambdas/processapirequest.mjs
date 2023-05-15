import {
    ACCEPTED,
    DDBBATCHSIZE,
    DEFAULTEXPIRY,
    REQBATCH,
    REQITEM,
    REQSUBBATCH,
    putItemDDB,
    putItemsDDB,
    putUnprocessedItemsDDB,
    updateItemDDB
} from "./constants.mjs";
import { BatchWriteCommand, DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";

const REGION = "eu-west-2";
const REQUESTSTABLENAME = process.env['REQUESTSTABLENAME'];
const PROCESSINGMETRICSTABLENAME = process.env['PROCESSINGMETRICSTABLENAME'];
const MONITORINGQUEUEURL = process.env['MONITORINGQUEUEURL'];

const HEADERSTART = "messageid,";
const ddbClient = new DynamoDBClient({ region: REGION });
const ddbDocClient = DynamoDBDocumentClient.from(ddbClient);
const sqsclient = new SQSClient();

function sleep(ms) {
    console.log("sleeping for " + ms + "ms");
    return new Promise((resolve) => { setTimeout(resolve, ms); });
}

export const handler = async (event) => {
    console.log(JSON.stringify(event));
    console.log("DDB table name is " + REQUESTSTABLENAME);
    console.log("Starting to process request at " + (Date.now()/1000));
    try {
        let request_batch = JSON.parse(event.body);
        let clientId = request_batch.clientid;
        let batchId = request_batch.batchid;
        console.log("client id is " + clientId + " and batch id is " + batchId);
        let rowArray = request_batch.items;
        console.log("Row Count is " + rowArray.length);
        let itemsAdded = 0;
        let items = [];
        let splitNo = 1;
        let batch_item = {
            request_partition: clientId,
            request_sort: batchId + REQBATCH,
            client_id: clientId,
            batch_id: batchId,
            record_status: "ACCEPTED",
            number_item: 99999999,
            number_sub_batches: 0,
            completed_item_count: 0,
            failed_item_count: 0,
            record_type: REQBATCH,
            time_received: parseInt((Date.now() / 1000).toString()),
            date_received: parseInt(new Date().toISOString().substring(0,10).replace(/-/g, "")),
            valid_until: parseInt((Date.now() / 1000).toString()) + DEFAULTEXPIRY
        }
        console.log("batch item is " + JSON.stringify(batch_item));
        let response = await putItemDDB(batch_item, REQUESTSTABLENAME, ddbDocClient);
        response = await putItemDDB(batch_item, PROCESSINGMETRICSTABLENAME, ddbDocClient);
        console.log("have put batch item into ddb");
        for (let i = 0; i < rowArray.length; i++) {
            let row = rowArray[i];
            //console.log("row is " + row);
            let requestId = rowArray[i].requestId;
            let nhsnumber = rowArray[i].nhsnumber;
            let requestTime = rowArray[i].requestTime;
            //put each sub-batch into a separate partition
            let request_partition = clientId + batchId + splitNo;
            let request_sort = requestId + REQITEM;
            let record_status = ACCEPTED;
            let item = {
                request_partition: request_partition,
                request_sort: request_sort,
                client_id: clientId,
                batch_id: batchId,
                sub_batch_no: splitNo,
                nhs_number: nhsnumber,
                request_time: requestTime,
                time_received: parseInt((Date.now() / 1000).toString()),
                date_received: parseInt(new Date().toISOString().substring(0,10).replace(/-/g, "")),
                request_id: requestId,
                record_status: record_status,
                record_type: "REQITEM",
                valid_until: parseInt((Date.now() / 1000).toString()) + DEFAULTEXPIRY
            }
            item = { ...item, ...rowArray[i] };
            items.push(item);
        }
        //add sub-batch item and all items
        if (items.length > 0) {
            let sub_batch_item = {
                request_partition: clientId + batchId + splitNo,
                request_sort: REQSUBBATCH,
                client_id: clientId,
                batch_id: batchId,
                sub_batch_no: splitNo,
                record_status: ACCEPTED,
                number_item: items.length,
                completed_item_count: 0,
                failed_item_count: 0,
                record_type: REQSUBBATCH,
                time_received: parseInt((Date.now() / 1000).toString()),
                date_received: parseInt(new Date().toISOString().substring(0,10).replace(/-/g, "")),
                valid_until: parseInt((Date.now() / 1000).toString()) + DEFAULTEXPIRY
            }
            console.log("sub batch item is " + JSON.stringify(sub_batch_item));
            let response = await putItemDDB(sub_batch_item, REQUESTSTABLENAME, ddbDocClient);
            response = await putItemDDB(sub_batch_item, PROCESSINGMETRICSTABLENAME, ddbDocClient);
            console.log("have put sub batch item into ddb");
            itemsAdded += items.length;
            let data = await putItemsDDB(items,REQUESTSTABLENAME, ddbDocClient);
            while (data.UnprocessedItems[REQUESTSTABLENAME] &&
                data.UnprocessedItems[REQUESTSTABLENAME].length > 0)
            {
                console.log("THERE ARE UNPROCESSED ITEMS - COUNT IS " + data.UnprocessedItems[REQUESTSTABLENAME].length);
                data = await putUnprocessedItemsDDB(data.UnprocessedItems[REQUESTSTABLENAME], REQUESTSTABLENAME, ddbDocClient);
            }
            console.log("have put " + items.length + " items into ddb");
        }

        //update number of items
        batch_item.number_item = itemsAdded;
        batch_item.number_sub_batches = splitNo;
        let updateParams = {
            "TableName": REQUESTSTABLENAME,
            "Key": {
                request_partition: clientId,
                request_sort: batchId + REQBATCH
            },
            "UpdateExpression": "set number_item = :s, number_sub_batches = :nsb",
            "ExpressionAttributeValues": {
                ":s": itemsAdded,
                ":nsb": splitNo
            },
            "ReturnValues": "ALL_NEW"
        };
        let updateData = await updateItemDDB(updateParams, ddbDocClient);
        updateParams.TableName = PROCESSINGMETRICSTABLENAME;
        updateData = await updateItemDDB(updateParams, ddbDocClient);
        console.log("have updated number of items on batch");
        //publish batch to monitoring queue
        let commandParams = {
            DelaySeconds: 30,
            MessageBody: JSON.stringify(batch_item),
            QueueUrl:MONITORINGQUEUEURL
        }
        console.log("sqs command is ", JSON.stringify(commandParams));
        const sqsresponse = await sqsclient.send(new SendMessageCommand(commandParams));
        console.log(JSON.stringify(sqsresponse));
        console.log("published item to SQS queue ", JSON.stringify(sqsresponse));

        console.log("Finished processing message at " + new Date().toISOString());
        let final_response = {
            "statusCode": 200,
            "headers": {
                "Content-Type": "application/json"
            },
            "body": JSON.stringify(batch_item)
        }
        return final_response;
    } catch (error) {
        console.log("caught error " + error.message);
        throw error;
    }
}