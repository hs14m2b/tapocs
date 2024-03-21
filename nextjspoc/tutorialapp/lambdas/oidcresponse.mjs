import { SSMClient, GetParameterCommand } from "@aws-sdk/client-ssm"; // ES Modules import
let https;
try {
  https = await import('node:https');
} catch (err) {
  console.error('https support is disabled!');
}
const NHSMAILSECRETPARAM = process.env["NHSMAILSECRETPARAM"];
var nhsmailsecret = "";

let config = {"region": "eu-west-2"};
const client = new SSMClient(config);
const input = { // GetParameterRequest
  Name: NHSMAILSECRETPARAM, // required
  WithDecryption: true
};
const command = new GetParameterCommand(input);
// { // GetParameterResult
//   Parameter: { // Parameter
//     Name: "STRING_VALUE",
//     Type: "String" || "StringList" || "SecureString",
//     Value: "STRING_VALUE",
//     Version: Number("long"),
//     Selector: "STRING_VALUE",
//     SourceResult: "STRING_VALUE",
//     LastModifiedDate: new Date("TIMESTAMP"),
//     ARN: "STRING_VALUE",
//     DataType: "STRING_VALUE",
//   },
// };

function sleep(ms) {
    console.log("sleeping for " + ms + "ms");
    return new Promise((resolve) => { setTimeout(resolve, ms); });
}
export const handler = async (event) => {
    console.log(JSON.stringify(event));
    try {
        nhsmailsecret = (nhsmailsecret=="") ? (await getNhsMailParameter(input)).Parameter.Value: nhsmailsecret;
    } catch (error) {
        console.log("failed to retrieve nhsmail secret key");
        console.log(error.message);
        let response = {
            statusCode: 500,
            "headers": {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({"error": error.message})
        }
        return response;
    }

	let requestParams = {};

    try {

        if (event.requestContext.http.method == "GET") {
            requestParams = event.queryStringParameters;
        }
        else {
            try 
            {
                requestParams = JSON.parse(event.body);
            }
            catch (err)
            {
                let searchParams = new URLSearchParams(event.body);
                for(const [key, value] of searchParams) { // each 'entry' is a [key, value] tuple
                    requestParams[key] = value;
                }
            }
        }
    
        let token_response = await getTokens("66dcf442-2933-4d84-b50d-30c7404632b6", requestParams);

        console.log(token_response);
        let response = {
            "statusCode": 200,
            "headers": {
                "Content-Type": "application/json"
            },
            "body": JSON.stringify(token_response)
        };
        console.log(JSON.stringify(response));
        return response;

    } catch (error) {
        console.log("caught error " + error.message);
        let response = {
            statusCode: 500,
            "headers": {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({"error": error.message})
        }
        return response;
    }
}

async function getNhsMailParameter(){
    return await client.send(command);
}

async function getTokens(nhsmailclientid, 
	requestParams)
	{
	let client_id = nhsmailclientid;
	console.log("client id is " + client_id);

	// form data
	let postData = new URLSearchParams({
		"code": requestParams.code,
		"client_id": client_id,
		"redirect_uri": "https://main-nextjsfe.nhsdta.com/extapi/oidcresponse",
		"grant_type": "authorization_code",
		"client_secret": nhsmailsecret
	  }).toString();
  
	console.log("request POST data is " + JSON.stringify(postData));
   
	// request option
	let options = {
		host: "login.microsoftonline.com",
		port: 443,
		method: 'POST',
		path: '/37c354b2-85b0-47f5-b222-07b48d774ee3/oauth2/v2.0/token',
		rejectUnauthorized: false,
		headers: {
		  'Content-Type': 'application/x-www-form-urlencoded',
		  'Content-Length': postData.length
		}
	  };
 
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
