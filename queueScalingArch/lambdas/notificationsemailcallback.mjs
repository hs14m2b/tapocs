let https;
try {
  https = await import('node:https');
} catch (err) {
  console.log('https support is disabled!');
}
const BATCHSIZE = 10;
const HOSTEDZONESUFFIX = process.env["HOSTEDZONESUFFIX"];
const BRANCHNAME = process.env["BRANCHNAME"];
const PROJECTNAME = process.env["PROJECTNAME"];
const CALLBACKDOMAIN = process.env["CALLBACKDOMAIN"];

function sleep(ms) {
    console.log("sleeping for " + ms + "ms");
    return new Promise((resolve) => { setTimeout(resolve, ms); });
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
        //do something with the request
        //delivered, permanent-failure or technical-failure
        let status = (Math.random() > 0.5) ? "delivered" : (Math.random() > 0.5) ? "permanent-failure" : "technical-failure";
        //status = "permanent-failure";
        //status = "delivered";
        let { id, reference } = messageBody;
        let callbackData = {
            id: id,
            reference: reference,
            to: messageBody.content.email_address,
            "status": status,
            "completed_at": new Date().toISOString,
            "notification_type": "email",
            "template_id": messageBody.template.id,
            "template_version": messageBody.template.version
        }
        console.log("callback data is " + JSON.stringify(callbackData));
        let callbackResponse = await makerequest(callbackData);
        console.log("callback response is " + JSON.stringify(callbackResponse));
    }
    return;
}

async function makerequest(callbackData)
	{
	let postData = JSON.stringify(callbackData);
  
	console.log("request POST data is " + JSON.stringify(postData));
    let domainName = BRANCHNAME + "-" + PROJECTNAME + "-" + CALLBACKDOMAIN + "." + HOSTEDZONESUFFIX;
	// request option
	let options = {
		host: domainName,
		port: 443,
		method: 'POST',
		path: '/extapi/notify/callback',
		rejectUnauthorized: false,
		headers: {
		  'Content-Type': 'application/json',
          'Content-Length': postData.length,
          'Authorization': "Bearer THISISTHETOKENTEST"
		}
	  };
    console.log("request options are " + JSON.stringify(options));
 
	return new Promise(function (resolve, reject) {
		// request object
		var req = https.request(options, function (res) {
			var result = '';
			res.on('data', function (chunk) {
				result += chunk;
			});
			res.on('end', function () {
				console.log(result);
				resolve(result);
			});
			res.on('error', function (err) {
				console.log(err);
				reject(err);
			})
		});
		 
		// req error
		req.on('error', function (err) {
		  console.log(err);
		});
		 
		//send request with the postData form
		req.write(postData);
		req.end();
	});
}
