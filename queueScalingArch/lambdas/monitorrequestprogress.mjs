import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { COMPLETED, DDBVALIDATIONERRORS, FAILED, REQBATCH, REQITEM, REQSUBBATCH, updateItemDDB, runQueryDDB } from "./constants.mjs";

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";

const REGION = "eu-west-2";
const ddbClient = new DynamoDBClient({ region: REGION });
const ddbDocClient = DynamoDBDocumentClient.from(ddbClient);
const sqsclient = new SQSClient({ region: REGION });
const REQUESTSTABLENAME = process.env['REQUESTSTABLENAME'];
const MONITORINGQUEUEURL = process.env['MONITORINGQUEUEURL'];

function sleep(ms) {
    console.log("sleeping for " + ms + "ms");
    return new Promise((resolve) => { setTimeout(resolve, ms); });
}

async function updateReqBatchCounts(client_id, batch_id, completed_item_count, failed_item_count)
{
    let updateParams2 = {
        "TableName": REQUESTSTABLENAME,
        "Key": {
            request_partition: client_id,
            request_sort: batch_id + REQBATCH
        },
        "UpdateExpression": "SET completed_item_count =  :cic, failed_item_count =  :fic",
        "ExpressionAttributeValues": {
            ":cic": completed_item_count,
            ":fic": failed_item_count
        },
        "ReturnValues": "ALL_NEW"
    };
    try {
        let updateResponse = await updateItemDDB(updateParams2, ddbDocClient);
        console.log("have updated the batch request " + JSON.stringify(updateResponse));
        let completed_item_count = updateResponse.Attributes.completed_item_count;
        let failed_item_count = updateResponse.Attributes.failed_item_count;
        let number_item = updateResponse.Attributes.number_item;
        if (completed_item_count + failed_item_count == number_item) {
            console.log("marking batch as " + COMPLETED)
            let time_completed = parseInt((Date.now() / 1000).toString());
            let date_completed = parseInt(new Date().toISOString().substring(0,10).replace(/-/g, ""));
            updateParams2 = {
                "TableName": REQUESTSTABLENAME,
                "Key": {
                    request_partition: client_id,
                    request_sort: batch_id + REQBATCH
                },
                "UpdateExpression": "SET record_status = :status, time_completed  =:tc, date_completed = :dc",
                "ConditionExpression": "record_status <> :s",
                "ExpressionAttributeValues": {
                    ":status": COMPLETED,
                    ":s": COMPLETED,
                    ":tc": time_completed,
                    ":dc": date_completed
                },
                "ReturnValues": "ALL_NEW"
            };
            updateResponse = await updateItemDDB(updateParams2, ddbDocClient);
            console.log("have updated the batch request " + JSON.stringify(updateResponse));
        }
        return updateResponse;
    }
    catch (error)
    {
        if (DDBVALIDATIONERRORS.includes(error.name))
        {
            console.log("caught database validation error - probably due to missing data from data clearout");
        }
        console.log("unable to update batch request");
    }
    return {};
}

async function getSubBatchItems(request_partition) {
    console.log("request partition is " + request_partition);
    let queryParams = {
        KeyConditionExpression: "request_partition = :rp",
        FilterExpression: "record_type in (:rt1, :rt2)",
        ExpressionAttributeValues: {
            ":rp": request_partition,
            ":rt1": REQSUBBATCH,
            ":rt2": REQITEM
        },
        TableName: REQUESTSTABLENAME
    };
    let data = await runQueryDDB(queryParams, ddbDocClient);
    return data;
}


export const handler = async (event) => {
    console.log(JSON.stringify(event));
    let failedItems = {
        "batchItemFailures": []
    }
    for (let i = 0; i < event.Records.length; i++)
    {
        console.log("Processing item " + (i + 1));
        //check that this is an sqs event
        if (event.Records[i].eventSource != "aws:sqs") {
            console.log("not processing this item as not received from SQS!");
            continue;
        }
        let itemIdentifier = event.Records[i].messageId;
        try {
            
            let messageBody = JSON.parse(event.Records[i].body);
            //update the count on the batch sub item
            //get all the request items in the batch
            let request_partition = messageBody.request_partition;
            let client_id = messageBody.client_id;
            let batch_id = messageBody.batch_id;
            let number_sub_batches = messageBody.number_sub_batches;
            let number_item = messageBody.number_item;
            let completed_item_count=0;
            let failed_item_count = 0;
            let sub_batches_found = false;
            //for each sub-batch in turn
            for (let i = 1; i <= number_sub_batches; i++){
                let sub_batch_request_partition = client_id + batch_id + i;
                let sub_batch_number_item = 0;
                let sub_batch_completed_item_count=0;
                let sub_batch_failed_item_count = 0;
                let items = await getSubBatchItems(sub_batch_request_partition);
                for (let item of items){
                    if (item.record_type == REQITEM){
                        if (item.record_status == COMPLETED) sub_batch_completed_item_count+=1;  
                        if (item.record_status == FAILED) sub_batch_failed_item_count+=1;  
                    }
                    else if (item.record_type == REQSUBBATCH){
                        sub_batch_number_item = item.number_item;
                        sub_batches_found = true;
                    }
                }
                completed_item_count += sub_batch_completed_item_count;
                failed_item_count += sub_batch_failed_item_count;
                if (sub_batch_number_item == 0) continue;
                if (sub_batch_number_item == sub_batch_failed_item_count + sub_batch_completed_item_count)
                {
                    console.log("the sub batch is complete");
                    let time_completed = parseInt((Date.now() / 1000).toString());
                    let date_completed = parseInt(new Date().toISOString().substring(0,10).replace(/-/g, ""));
                    try {
                        let updateParams2 = {
                            "TableName": REQUESTSTABLENAME,
                            "Key": {
                                request_partition: sub_batch_request_partition,
                                request_sort: REQSUBBATCH
                            },
                            "UpdateExpression": "SET record_status = :status, time_completed  =:tc, completed_item_count = :cic, failed_item_count = :fic, date_completed = :dc",
                            "ConditionExpression": "record_status <> :s",
                            "ExpressionAttributeValues": {
                                ":status": COMPLETED,
                                ":s": COMPLETED,
                                ":tc": time_completed,
                                ":cic": sub_batch_completed_item_count,
                                ":fic": sub_batch_failed_item_count,
                                ":dc": date_completed
                            },
                            "ReturnValues": "ALL_NEW"
                        };
                        try {
                            let updateResponse = await updateItemDDB(updateParams2, ddbDocClient);
                            console.log("have updated the sub batch request " + JSON.stringify(updateResponse));
                        } catch (error) {
                            if (DDBVALIDATIONERRORS.includes(error.name))
                            {
                                console.log("caught database validation error - probably due to missing data from data clearout");
                            }
                            console.log("unable to update batch request", error.name, error.message);
                            continue;
                        }
                    } catch (error) {
                        console.log("update of sub-batch failed due to [" + error.message + "]");            
                    }
                }
            }
            console.log("completed items number is ", completed_item_count);
            console.log("failed items number is " + failed_item_count);
            console.log("total number of items is " + number_item);
            console.log("There are " + completed_item_count + " items completed and " + failed_item_count + " items failed out of a total of " + number_item);
            if (number_item == 0 ) continue;
            if (!sub_batches_found)
            {
                console.log("no sub-batches found - ending monitoring");
                continue;
            }
            console.log("updating batch counts ")
            try {
                let updateResponse = await updateReqBatchCounts(client_id, batch_id, completed_item_count, failed_item_count)
                if (updateResponse.Attributes.record_status != COMPLETED)
                {
                    //requeue the item
                    //publish batch to monitoring queue
                    let commandParams = {
                        DelaySeconds: 30,
                        MessageBody: JSON.stringify(messageBody),
                        QueueUrl:MONITORINGQUEUEURL
                    }
                    const sqsresponse = await sqsclient.send(new SendMessageCommand(commandParams));
                    console.log(JSON.stringify(sqsresponse));
                    console.log("published item to SQS queue ", JSON.stringify(sqsresponse));
                }
            } catch (error) {
                if (DDBVALIDATIONERRORS.includes(error.name))
                {
                    console.log("caught database validation error - probably due to missing data from data clearout");
                }
                console.log("unable to update batch request", error.name, error.message);
                continue;
            }
        } catch (error) {
            let failedItem = {
                "itemIdentifier": itemIdentifier
            };
            failedItems.batchItemFailures.push(failedItem);
            console.log("failed to process SQS record ", error.name, error.message);
        }
            
    }
    return failedItems;
}
