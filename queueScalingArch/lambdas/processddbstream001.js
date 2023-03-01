const { SQSClient, SendMessageCommand } = require("@aws-sdk/client-sqs");
const REQUESTSQUEUENAME = process.env['REQUESTSQUEUENAME'];
const REQUESTSQUEUEURL = process.env['REQUESTSQUEUEURL'];
const client = new SQSClient();

function sleep(ms) {
    console.log("sleeping for " + ms + "ms");
    return new Promise((resolve) => { setTimeout(resolve, ms); });
}


exports.handler = async (event) => {
    console.log(JSON.stringify(event));
    for (let i = 0; i < event.Records.length; i++)
    {
        console.log("Processing item " + (i + 1));
        //check that this is an insert
        if (event.Records[i].eventName != "INSERT") {
            console.log("not processing this item as not an insert");
            continue;
        }
        let messageBody = event.Records[i].dynamodb.NewImage
        //check that it is for a request
        if (!messageBody.request_sort || !messageBody.request_sort["S"] || !messageBody.request_sort["S"].startsWith("REQITEM")) {
            console.log("not processing as not a REQITEM");
            continue;
        }
        let commandParams = {
            DelaySeconds: 0,
            MessageBody: JSON.stringify(messageBody),
            QueueUrl:REQUESTSQUEUEURL
        }
        const response = await client.send(new SendMessageCommand(commandParams));
        console.log(JSON.stringify(response));
    }
    return;
}