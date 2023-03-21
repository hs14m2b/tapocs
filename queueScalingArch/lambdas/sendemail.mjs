import { BatchWriteCommand, DynamoDBDocumentClient, PutCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { ROUTEPLAN, updateItemDDB } from "./constants.mjs";
import { SQSClient, SendMessageBatchCommand, SendMessageCommand } from "@aws-sdk/client-sqs";

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { NotifyClient } from "notifications-node-client";

const REGION = "eu-west-2";
const ddbClient = new DynamoDBClient({ region: REGION });
const ddbDocClient = DynamoDBDocumentClient.from(ddbClient);
const REQUESTSTABLENAME = process.env['REQUESTSTABLENAME'];
const DELIVERYQUEUEURL = process.env['DELIVERYQUEUEURL'];
const client = new SQSClient();
const BATCHSIZE = 0;
const TEMPLATEID = "b844408b-e85d-470d-9d56-49bbc20f282d";
const NOTIFYAPIKEY = "commsmgrpoc-5e556db9-b71b-472a-9ba0-627bc2954844-55a0fec2-fc3e-4b8e-8027-9835190ad242";
const SYNTHETICNOTIFYURL = "https://" + process.env["SYNTHNOTIFYDOMAIN"];
// for sending requests to synthetic gov notify 
const notifyClient = new NotifyClient(SYNTHETICNOTIFYURL, NOTIFYAPIKEY);
// for sending requests to real gov notify 
//const notifyClient = new NotifyClient(NOTIFYAPIKEY);


function sleep(ms) {
    console.log("sleeping for " + ms + "ms");
    return new Promise((resolve) => { setTimeout(resolve, ms); });
}

async function sendEmail(email, personalisation, reference) {
    /*
    let syntheticresult = {
        data: {
            message: "pretended to send the email"
        }
    }
    return syntheticresult;
    */
	return await notifyClient
		.sendEmail(TEMPLATEID, email, {
			personalisation: personalisation,
			reference: reference
		});
}


export const handler = async (event) => {
    console.log(JSON.stringify(event));
    let items = [];
    for (let i = 0; i < event.Records.length; i++)
    {
        console.log("Processing item " + (i + 1));
        //check that this is an SMS
        if (event.Records[i].eventSource != "aws:sqs") {
            console.log("not processing this item as not received from SQS!");
            continue;
        }
        let messageBody = JSON.parse(event.Records[i].body);
        console.log("partition " + messageBody.request_partition + " sort " + messageBody.request_sort);
        console.log("client id " + messageBody.client_id);
        let email = messageBody.endpoint;
        console.log("email is " + email);
        let personalisation = messageBody.personalisation;
        console.log("personalisation is " + JSON.stringify(personalisation));
        let reference = messageBody.request_partition + "." + messageBody.request_sort;
        //check that it is for a delivery
        if (!messageBody.request_sort || !messageBody.request_sort.endsWith(ROUTEPLAN)) {
            console.log("not processing as not a ROUTEPLAN");
            continue;
        }

        //pretend to send the message
        let result = await sendEmail(email, personalisation, reference);
        console.log("result of sending email is " + result.data);
        let updateParams = {
            "TableName": REQUESTSTABLENAME,
            "Key": {
                request_partition: messageBody.request_partition,
                request_sort: messageBody.request_sort
            },
            "UpdateExpression": "set record_status = :s",
            "ExpressionAttributeValues": {
                ":s": "SENT"
            },
            "ReturnValues": "ALL_NEW"
        };
        console.log("sleeping for EMAIL sending");
        await sleep(100);
        let updateData = await updateItemDDB(updateParams, ddbDocClient);
    }
    return;
}