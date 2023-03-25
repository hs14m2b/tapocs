import { ACTIVE, DEFAULTEXPIRY, PENDING, REQITEM, ROUTEPLAN, putItemsDDB, putUnprocessedItemsDDB, updateItemDDB } from "./constants.mjs";
import { BatchWriteCommand, DynamoDBDocumentClient, PutCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { SQSClient, SendMessageBatchCommand, SendMessageCommand } from "@aws-sdk/client-sqs";

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { getOAuth2AccessToken } from './api_common_functions.mjs';

const REGION = "eu-west-2";
const ddbClient = new DynamoDBClient({ region: REGION });
const ddbDocClient = DynamoDBDocumentClient.from(ddbClient);
const REQUESTSTABLENAME = process.env['REQUESTSTABLENAME'];
const SMSDELIVERYQUEUEURL = process.env['SMSDELIVERYQUEUEURL'];
const EMAILDELIVERYQUEUEURL = process.env['EMAILDELIVERYQUEUEURL'];
const client = new SQSClient();
const BATCHSIZE = 0;

function sleep(ms) {
    console.log("sleeping for " + ms + "ms");
    return new Promise((resolve) => { setTimeout(resolve, ms); });
}

async function sendItemsSQS(items) {
    let params = {
        "QueueUrl": DELIVERYQUEUEURL,
        Entries: []
    };
    for (item of items) {
        params.Entries.push(item);
    }
    const data = await client.send(new SendMessageBatchCommand(params));
    console.log("Success - items added to SQS", data);
    return data;
} 

async function getAPIToken(){
    console.log("getting access token");
    let oauth_response = JSON.parse(await getOAuth2AccessToken(apiKey, kid, privatekey, APIMDOMAIN, APIAUTHPATH)) ;
    access_token = oauth_response.access_token;
    oauth2_issued_time = Math.floor(parseInt(oauth_response.issued_at)/1000);
    oauth2_validity_period = parseInt(oauth_response.expires_in);

}

export const handler = async (event) => {
    console.log(JSON.stringify(event));
    let items = [];
    for (let i = 0; i < event.Records.length; i++) {
        console.log("Processing item " + (i + 1));
        //check that this is an insert
        if (event.Records[i].eventSource != "aws:sqs") {
            console.log("not processing this item as not received from SQS!");
            continue;
        }
        let messageBody = JSON.parse(event.Records[i].body);
        console.log("partition " + messageBody.request_partition + " sort " + messageBody.request_sort);
        console.log("nhs number " + messageBody.nhs_number);
        console.log("client id " + messageBody.client_id);
        //check that it is for a request
        if (!messageBody.request_sort || !messageBody.request_sort.endsWith(REQITEM)) {
            console.log("not processing as not a REQITEM");
            continue;
        }
        let batch_id = messageBody.batch_id;
        let request_id = messageBody.request_id;
        let sub_batch_no = messageBody.sub_batch_no;
        //get the demographics info
        let demoInfo = {
            "title": "Mr",
            "familyname": "Brown",
            "givenname": "Matthew",
            "nhsnumberformatted": messageBody.nhs_number.substring(0, 3) + " " + messageBody.nhs_number.substring(3, 6) + " " + messageBody.nhs_number.substring(6)
        }
        let updateParams = {
            "TableName": REQUESTSTABLENAME,
            "Key": {
                request_partition: messageBody.request_partition,
                request_sort: messageBody.request_sort
            },
            "UpdateExpression": "set email = :e, mobile_phone = :m, record_status = :s, active_plan = :p",
            "ExpressionAttributeValues": {
                ":e": "me@you.com",
                ":m": "07765432109",
                ":s": "ENRICHED",
                ":p": "001"
            },
            "ReturnValues": "ALL_NEW"
        };
        console.log("sleeping for demographics retrieval");
        await sleep(30);
        let updateData = await updateItemDDB(updateParams,ddbDocClient);
        //get the routing plan for the message
        console.log("sleeping for retrieval of routing info");
        await sleep(100);

        let plan1channel = (Math.random() > 0.5) ? {"channel": "SMS", "endpoint": "07747461749"} : {"channel": "EMAIL", "endpoint": "matthewandkaren@hotmail.com"};
        //set to email for testing temporarily
        //plan1channel = {"channel": "EMAIL", "endpoint": "matthewandkaren@hotmail.com"};
        let plan2channel = (plan1channel.channel == "EMAIL") ? {"channel": "SMS", "endpoint": "07747461749"} : {"channel": "EMAIL", "endpoint": "matthewandkaren@hotmail.com"};
        let personalisation =  { title: demoInfo.title, familyname: demoInfo.familyname, nhsnumberformatted: demoInfo.nhsnumberformatted };
        let plan001 = {
            request_partition: messageBody.request_partition,
            request_sort: request_id + "001" + ROUTEPLAN,
            record_type: ROUTEPLAN,
            record_status: ACTIVE,
            channel: plan1channel.channel,
            endpoint: plan1channel.endpoint,
            batch_id: batch_id,
            sub_batch_no: sub_batch_no,
            request_id: request_id,
            time_received: parseInt((Date.now() / 1000).toString()),
            date_received: parseInt(new Date().toISOString().substring(0,10).replace(/-/g, "")),
            plan_sequence: 1,
            valid_until: parseInt((Date.now() / 1000).toString()) + DEFAULTEXPIRY,
            personalisation: personalisation
        };
        let plan002 = {
            request_partition: messageBody.request_partition,
            request_sort: request_id + "002" + ROUTEPLAN,
            record_type: ROUTEPLAN,
            record_status: PENDING,
            channel: plan2channel.channel,
            endpoint: plan2channel.endpoint,
            batch_id: batch_id,
            sub_batch_no: sub_batch_no,
            request_id: request_id,
            time_received: parseInt((Date.now() / 1000).toString()),
            date_received: parseInt(new Date().toISOString().substring(0,10).replace(/-/g, "")),
            plan_sequence: 2,
            valid_until: parseInt((Date.now() / 1000).toString()) + DEFAULTEXPIRY,
            personalisation: personalisation
        };
        let plans = [plan001, plan002];
        //batch insert the items into DDB
        let data = await putItemsDDB(plans,REQUESTSTABLENAME, ddbDocClient);
        while (data.UnprocessedItems[REQUESTSTABLENAME] &&
            data.UnprocessedItems[REQUESTSTABLENAME].length > 0)
        {
            console.log("THERE ARE UNPROCESSED ITEMS - COUNT IS " + data.UnprocessedItems[REQUESTSTABLENAME].length);
            data = await putUnprocessedItemsDDB(data.UnprocessedItems[REQUESTSTABLENAME],REQUESTSTABLENAME, ddbDocClient);
        }
        //publish the event to the "send requests" queue
        let sqsParams = {
            DelaySeconds: 0,
            MessageAttributes: {
                "channel": {
                    "DataType": "String",
                    "StringValue": plan001.channel
                }
            },
            MessageBody: JSON.stringify(plan001),
            QueueUrl: (plan001.channel == "SMS") ? SMSDELIVERYQUEUEURL : EMAILDELIVERYQUEUEURL
        }
        const response = await client.send(new SendMessageCommand(sqsParams));
        console.log(JSON.stringify(response));
    }
    return;
}