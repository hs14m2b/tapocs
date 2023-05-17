import { v4 as uuidv4 } from 'uuid';

let https;
try {
  https = await import('node:https');
} catch (err) {
  console.error('https support is disabled!');
}


async function makerequest(batchRequest)
	{
	let postData = JSON.stringify(batchRequest);
  
	console.log("request POST data is " + JSON.stringify(postData));
    let domainName = "internal-dev.api.service.nhs.uk";
    let path = "/nhse-tsas-solarch-demo-api/extapi/consumer/request"
	// request option
	let options = {
		host: domainName,
		port: 443,
		method: 'POST',
		path: path,
		rejectUnauthorized: false,
		headers: {
		  'Content-Type': 'application/json',
          'Content-Length': postData.length,
          'apikey': "Too5BdPayTQACdw1AJK1rD4nKUD0Ag7J"
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

let batch_id = Date.now().toString();
let client_id = "12345";
let batchRequest = {
    clientid: client_id,
    batchid: batch_id,
    items: []
}
let maxRows = 10;
for (let i = 1; i <= maxRows; i++){
    let id = uuidv4()+ i.toString().padStart(10, '0');;
    let nhsnumber = i.toString().padStart(10, '9');
    let __time = Date.now().toString();
    let personalisation = {
      "title": "Mr",
      "familyname": "Brown",
      "givenname": "Matthew",
      "nhsnumberformatted": nhsnumber.substring(0, 3) + " " + nhsnumber.substring(3, 6) + " " + nhsnumber.substring(6)
    };
    let request_item = {
      requestId: id,
      requestTime: __time,
      nhsnumber: nhsnumber,
      client_id: client_id,
      batch_id: batch_id,
      personalisation: personalisation
    }
    batchRequest.items.push(request_item);
}
console.log(JSON.stringify(batchRequest));
await makerequest(batchRequest);
let status_url = "https://internal-dev.api.service.nhs.uk/nhse-tsas-solarch-demo-api/extapi/consumer/request/"+client_id+"/"+batch_id;
console.log("URL to retrieve status of batch is " + status_url);
console.log("curl -X GET " + status_url + " -H \"apikey: Too5BdPayTQACdw1AJK1rD4nKUD0Ag7J\"");
