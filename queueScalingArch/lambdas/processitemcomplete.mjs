import { BatchWriteCommand, DynamoDBDocumentClient, PutCommand, QueryCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { COMPLETED, DDBVALIDATIONERRORS, FAILED, REQBATCH, REQITEM, REQSUBBATCH, putItemWithConditionDDB, updateItemDDB } from "./constants.mjs";

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";

const REGION = "eu-west-2";
const ddbClient = new DynamoDBClient({ region: REGION });
const ddbDocClient = DynamoDBDocumentClient.from(ddbClient);
const REQUESTSTABLENAME = process.env['REQUESTSTABLENAME'];
const PROCESSINGMETRICSTABLENAME = process.env['PROCESSINGMETRICSTABLENAME'];

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
        "UpdateExpression": "SET completed_item_count = completed_item_count + :cic, failed_item_count = failed_item_count + :fic",
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
            updateParams2 = {
                "TableName": REQUESTSTABLENAME,
                "Key": {
                    request_partition: client_id,
                    request_sort: batch_id + REQBATCH
                },
                "UpdateExpression": "SET record_status = :status, time_completed  =:tc",
                "ConditionExpression": "record_status <> :s",
                "ExpressionAttributeValues": {
                    ":status": COMPLETED,
                    ":s": COMPLETED,
                    ":tc": time_completed
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

export const handler = async (event) => {
    console.log(JSON.stringify(event));
    let failedItems = {
        "batchItemFailures": []
    }
    for (let i = 0; i < event.Records.length; i++)
    {
        console.log("Processing item " + (i + 1));
        //check that this is an SMS
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
            let batch_id = messageBody.batch_id;
            let sub_batch_no = messageBody.sub_batch_no;
            let update_fragment = "";
            if (messageBody.record_status == COMPLETED) {
                update_fragment = "SET completed_item_count = completed_item_count + :increment";
            }
            else
            {
                update_fragment = "SET failed_item_count = failed_item_count + :increment";
            }
            let updateParams = {
                "TableName": PROCESSINGMETRICSTABLENAME,
                "Key": {
                    request_partition: request_partition,
                    request_sort: REQSUBBATCH
                },
                "UpdateExpression": update_fragment,
                "ExpressionAttributeValues": {
                    ":increment": 1
                },
                "ReturnValues": "ALL_NEW"
            };
            let updateData = null;
            try {
                updateData = await updateItemDDB(updateParams, ddbDocClient);
            } catch (error) {
                if (DDBVALIDATIONERRORS.includes(error.name))
                {
                    console.log("caught database validation error - probably due to missing data from data clearout");
                }
                console.log("unable to increment batch count");
                continue;
            }
            let completed_item_count = updateData.Attributes.completed_item_count;
            let failed_item_count = updateData.Attributes.failed_item_count;
            let number_item = updateData.Attributes.number_item;
            console.log("There are " + completed_item_count + " items completed and " + failed_item_count + " items failed out of a total of " + number_item);
            if (number_item == 0) continue;
            if (completed_item_count + failed_item_count == number_item) {
                console.log("marking sub batch as " + COMPLETED)
                let time_completed = parseInt((Date.now() / 1000).toString());
                try {
                    let updateParams2 = {
                        "TableName": REQUESTSTABLENAME,
                        "Key": {
                            request_partition: request_partition,
                            request_sort: REQSUBBATCH
                        },
                        "UpdateExpression": "SET record_status = :status, time_completed  =:tc, completed_item_count = :cic, failed_item_count = :fic",
                        "ConditionExpression": "record_status <> :s",
                        "ExpressionAttributeValues": {
                            ":status": COMPLETED,
                            ":s": COMPLETED,
                            ":tc": time_completed,
                            ":cic": completed_item_count,
                            ":fic": failed_item_count
                        },
                        "ReturnValues": "ALL_NEW"
                    };
                    try {
                        let updateResponse = await updateItemDDB(updateParams2, ddbDocClient);
                        console.log("have updated the sub batch request " + JSON.stringify(updateResponse));
                        console.log("updating counts on REQBATCH item");
                        let client_id = updateResponse.Attributes.client_id;
                        let batch_id = updateResponse.Attributes.batch_id;
                        updateResponse = await updateReqBatchCounts(client_id, batch_id, completed_item_count, failed_item_count)
                    } catch (error) {
                        if (DDBVALIDATIONERRORS.includes(error.name))
                        {
                            console.log("caught database validation error - probably due to missing data from data clearout");
                        }
                        console.log("unable to update batch request", error.name, error.message);
                        continue;
                    }
                } catch (error) {
                    console.log("update of batch failed due to [" + error.message + "]");            
                }
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
