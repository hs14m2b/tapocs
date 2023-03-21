import { SQSClient, SendMessageBatchCommand, SendMessageCommand } from "@aws-sdk/client-sqs";

import { unmarshall } from "@aws-sdk/util-dynamodb";

const REQUESTSQUEUENAME = process.env['REQUESTSQUEUENAME'];
const REQUESTSQUEUEURL = process.env['REQUESTSQUEUEURL'];
const client = new SQSClient();
const BATCHSIZE = 10;

function sleep(ms) {
    console.log("sleeping for " + ms + "ms");
    return new Promise((resolve) => { setTimeout(resolve, ms); });
}

async function sendItemsSQS(items) {
    let params = {
        "QueueUrl": REQUESTSQUEUEURL,
        Entries: []
    };
    for (let item of items) {
        params.Entries.push(item);
    }
    const data = await client.send(new SendMessageBatchCommand(params));
    console.log("Success - items added to SQS", data);
    return data;
} 



export const handler = async (event) => {
    console.log(JSON.stringify(event));
    let items = [];
    for (let i = 0; i < event.Records.length; i++)
    {
        console.log("Processing item " + (i + 1));
        //check that this is an insert
        if (event.Records[i].eventName != "INSERT") {
            console.log("not processing this item as not an insert");
            continue;
        }
        let messageBody = unmarshall(event.Records[i].dynamodb.NewImage);
        //check that it is for a request
        if (!messageBody.request_sort || messageBody.record_type != "REQITEM") {
            console.log("not processing as not a REQITEM");
            continue;
        }
        let commandParams = {
            DelaySeconds: 0,
            MessageBody: JSON.stringify(messageBody),
            QueueUrl:REQUESTSQUEUEURL
        }
        if (BATCHSIZE > 0) {
            //running in batch mode
            delete commandParams.QueueUrl;
            commandParams.Id = i.toString();
            items.push(commandParams);
            if (items.length == BATCHSIZE) {
                let data = await sendItemsSQS(items);
                console.log("have sent " + items.length + " items to SQS");
                items = [];
            }
        }
        else {
            const response = await client.send(new SendMessageCommand(commandParams));
            console.log(JSON.stringify(response));
        }
    }
    if (items.length > 0) {
        let data = await sendItemsSQS(items);
        console.log("have sent " + items.length + " items to SQS");
        items = [];
    }
    return;
}