import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";

import { DEFAULTEXPIRY, RANDOMCALLBACKDELAY } from "./constants.mjs";
import { v4 as uuidv4 } from 'uuid';

const REGION = "eu-west-2";
const EMAILQUEUEURL= process.env['EMAILQUEUEURL'];
const client = new SQSClient();

function sleep(ms) {
    console.log("sleeping for " + ms + "ms");
    return new Promise((resolve) => { setTimeout(resolve, ms); });
}

async function sendItemSQS(item) {
    //publish the event to the "send requests" queue
    let delaySeconds = parseInt((Math.random() * RANDOMCALLBACKDELAY).toString());
    let sqsParams = {
        DelaySeconds: delaySeconds,
        MessageBody: JSON.stringify(item),
        QueueUrl: EMAILQUEUEURL
    }
    const response = await client.send(new SendMessageCommand(sqsParams));
    console.log(JSON.stringify(response));
    return response;
}

export const handler = async (event) => {
    console.log(JSON.stringify(event));

    let example_request = {
        "version": "2.0",
        "routeKey": "POST /v2/notifications/email",
        "rawPath": "/v2/notifications/email",
        "rawQueryString": "",
        "headers": {
            "accept": "application/json, text/plain, */*",
            "authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiI1ZTU1NmRiOS1iNzFiLTQ3MmEtOWJhMC02MjdiYzI5NTQ4NDQiLCJpYXQiOjE2Nzg5NzczMDd9.5bMlXZ7efs0Lo_IUdETn9JEiB_qQ3fF-kU3UIhKan54",
            "content-length": "261",
            "content-type": "application/json",
            "host": "main-queuescaling-notifications.nhsdta.com",
            "user-agent": "NOTIFY-API-NODE-CLIENT/7.0.0",
            "x-amzn-trace-id": "Root=1-64132918-5995ac95623583bc0cf7ad0a",
            "x-forwarded-for": "86.138.89.219",
            "x-forwarded-port": "443",
            "x-forwarded-proto": "https"
        },
        "requestContext": {
            "accountId": "865198111306",
            "apiId": "d10a6g8tic",
            "domainName": "main-queuescaling-notifications.nhsdta.com",
            "domainPrefix": "main-queuescaling-notifications",
            "http": {
                "method": "POST",
                "path": "/v2/notifications/email",
                "protocol": "HTTP/1.1",
                "sourceIp": "86.138.89.219",
                "userAgent": "NOTIFY-API-NODE-CLIENT/7.0.0"
            },
            "requestId": "B4Nb6iwNLPEEMww=",
            "routeKey": "POST /v2/notifications/email",
            "stage": "$default",
            "time": "16/Mar/2023:14:35:04 +0000",
            "timeEpoch": 1678977304792
        },
        "body": "{\"template_id\":\"b844408b-e85d-470d-9d56-49bbc20f282d\",\"email_address\":\"matthewandkaren@hotmail.com\",\"personalisation\":{\"title\":\"Mr\",\"familyname\":\"Brown\",\"givenname\":\"Matthew\",\"nhsnumberformatted\":\"9999998765\"},\"reference\":\"4d349ff1-fc16-4e2f-9002-f7ab3d8286ec\"}",
        "isBase64Encoded": false
    };
    
    let received_body = JSON.parse(event.body);
    let { reference, template_id, email_address } = received_body;
    let notifyid = uuidv4();
    let response_body = {
        "id": notifyid,
        "reference": reference,
        "content": {
            "subject": "SUBJECT TEXT",
            "body": "MESSAGE TEXT",
            "from_email": "testservicemrb@notifications.service.gov.uk",
            "email_address": email_address
        },
        "uri": "https://api.notifications.service.gov.uk/v2/notifications/" + notifyid,
        "template": {
            "id": "b844408b-e85d-470d-9d56-49bbc20f282d",
            "uri": "https://api.notifications.service.gov.uk/services/5e556db9-b71b-472a-9ba0-627bc2954844/templates/b844408b-e85d-470d-9d56-49bbc20f282d",
            "version": 1
        }
    };

    // add response body to SQS
    let sqsResponse = await sendItemSQS(response_body);

    let response = {
        "status": 201,
        "body": JSON.stringify(response_body)
    }
    return response;
}