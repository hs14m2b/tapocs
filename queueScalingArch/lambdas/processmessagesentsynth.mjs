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
        //check that this is an update
        if (event.Records[i].eventName != "MODIFY") {
            console.log("not processing this item as not an update");
            continue;
        }
        let messageBody = event.Records[i].dynamodb.NewImage
        //check that it is for a route plan
        if (!messageBody.record_type || !messageBody.record_type["S"] || messageBody.record_type["S"] != "ROUTEPLAN") {
            console.log("not processing as not a ROUTEPLAN");
            continue;
        }
        //check that record_status is now "SENT"
        if (!messageBody.record_status || !messageBody.record_status["S"] || messageBody.record_status["S"] != "SENT") {
            console.log("not processing as record_status is not SENT");
            continue;
        }
        //do something with the request
        let callbackData = {
            id: "cdbb5ad6-60c9-48d3-bee2-a6bb82f50772",
            reference: messageBody.request_partition["S"] + "." + messageBody.request_sort["S"],
            to: messageBody.endpoint["S"],
            "status": "delivered",
            "completed_at": new Date().toISOString,
            "notification_type": messageBody.channel["S"],
            "template_id": "b844408b-e85d-470d-9d56-49bbc20f282d",
            "template_version": 1
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
