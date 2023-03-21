import { ANALYTICSPREFIX, REGION } from './constants.mjs';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';

import { unmarshall } from "@aws-sdk/util-dynamodb";

const ANALYTICSBUCKET = process.env['ANALYTICSBUCKET'];

const s3Client = new S3Client({
    apiVersion: '2006-03-01',
    region: REGION
})

function sleep(ms) {
    console.log("sleeping for " + ms + "ms");
    return new Promise((resolve) => { setTimeout(resolve, ms); });
}

async function writeAnalyticsFile(item, bucket, request_partition, request_sort, client_id)
{
    let body = JSON.stringify(item).replace("\n","").replace("\r", "");
    let params = {
        "Body": body,
        "Bucket": bucket,
        "Key": ANALYTICSPREFIX + client_id + "/" + request_partition + "-" + request_sort + ".json"
    }
    const response = await s3Client
        .send(new PutObjectCommand(params))
    return response;
}


export const handler = async (event) => {
    //console.log(JSON.stringify(event));
    let failedItems = {
        "batchItemFailures": []
    }
    let items = [];
    for (let i = 0; i < event.Records.length; i++)
    {
        let itemIdentifier = event.Records[i].eventID;
        //check that this is not a DELETE
        if (event.Records[i].eventName == "DELETE" || event.Records[i].eventName == "REMOVE") {
            console.log("not processing this item is a DELETE");
            continue;
        }
        try {
            let messageBody = event.Records[i].dynamodb.NewImage;
            //convert to plain JSON
            let messageBodyPlain = unmarshall(messageBody);
            //get partition and sort information
            let { request_partition, request_sort, client_id } = messageBodyPlain;
            if (!client_id) client_id = request_partition;
            console.log("Processing item " + (i + 1) + " which is a " + event.Records[i].eventName + " for " + request_partition + " - " + request_sort);
            let writeResult = await writeAnalyticsFile(messageBodyPlain, ANALYTICSBUCKET, request_partition, request_sort, client_id);
        } catch (error) {
            let failedItem = {
                "itemIdentifier": itemIdentifier
            };
            failedItems.batchItemFailures.push(failedItem);
            console.log("failed to process ddb record ", error.name, error.message, event.Records[i]);
        }
    }
    return failedItems;
}