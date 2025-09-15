var https = require('https');
var querystring = require('querystring');
var crypto = require('crypto');
process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;
const jwt = require('jsonwebtoken');
const uuid = require('uuid');
const jwksClient = require('jwks-rsa');
const ms = require('ms');
const iss = process.env.TOKENISSUER;
const iss_domain = iss.substring(8);
const api_domain = process.env.APIDOMAIN;
const redirect_uri = "https://" + api_domain + "/client";
const jwks_uri = iss + "/.well-known/jwks.json";
const signalg = process.env.SIGNALG;
const fs = require('fs');
const clientPrivateKey = fs.readFileSync('./nhslogin_client_private_key.pem', 'ascii');
const verification_options = {
	"algorithms": [signalg],
	"issuer": iss
};
var client = jwksClient({ 
	"cache": true,
	"cacheMaxEntries": 5, // Default value
	"cacheMaxAge": ms('10h'), // Default value
	"jwksUri": jwks_uri,
	"strictSsl": false
});
console.log("Created client holding jwks.json from OIDC server");
const apiClientPrivateKey = fs.readFileSync('./api_client_RS512.key', 'ascii');
const APIKEY = process.env.APIKEY;
const APIAPPID = process.env.APIAPPID;
const APIAUTHENDPOINT = process.env.APIAUTHENDPOINT;
const APIAUTHPATH = process.env.APIAUTHPATH;
const APIMDOMAIN = process.env.APIMDOMAIN;
const KEYID = process.env.KEYID;
const VACCSAPIPATH = process.env.VACCSAPIPATH;
const TESTRESULTAPIPATH = process.env.TESTRESULTAPIPATH;
const HTTPS = "https://"
const IDTOKENHEADER = "NHSD-User-Identity";
const eventHandler = require('./get_vaccs_history');
const testResultEventHandler = require('./getTestResults');

exports.handler = async (event) => {
    console.log("Event Data is " + JSON.stringify(event));
	var requestParams;
	if (event.httpMethod == "GET") {
        requestParams = event.queryStringParameters;
	}
    let data = await makerequest(requestParams);
    console.log(data);
	let data_json = JSON.parse(data);
	if (!data_json.access_token) {
		let response = {
			statusCode: 400,
			"headers": {
				"Access-Control-Allow-Origin": "*"
			},
			body: JSON.stringify(data_json)
		};
		return response;
	}
	let access_token = data_json.access_token;
    console.log(access_token);
	let id_token = data_json.id_token;
    console.log(id_token);
	let patient = await getPatient(access_token);
    console.log(patient);
	let patient_json = JSON.parse(patient);


	console.log("retrieving vaccs and test results information");
	let vaccs_result =  await eventHandler.handleEvent(event, APIKEY, APIAUTHENDPOINT, KEYID, apiClientPrivateKey, id_token, APIMDOMAIN, VACCSAPIPATH, APIAUTHPATH, null);
	let test_results_result =  await testResultEventHandler.handleEvent(event, APIKEY, APIAUTHENDPOINT, KEYID, apiClientPrivateKey, id_token, APIMDOMAIN, TESTRESULTAPIPATH, APIAUTHPATH);

	let response_body = { "patient_details": patient_json, "tokens": data_json, vaccinations: JSON.parse(vaccs_result), test_results: JSON.parse(test_results_result)};

	let response = {
        statusCode: 200,
		"headers": {
			"Access-Control-Allow-Origin": "*"
		},
        body: JSON.stringify(response_body)
    };
    return response;
};

async function makerequest(requestParams)
{
	console.log("Making request to get OIDC tokens");

	let client_id = (requestParams.client_id)? requestParams.client_id: "832a7164-93f7-4f23-9c77-4a2205227fab";
	let audience = iss + "/token";
	let expiresIn = 600;
	let jwtid = uuid.v4();
	var client_token_sign_options = { 
		"algorithm": signalg,
		"subject": client_id,
		"issuer": client_id,
		"audience": audience,
		"jwtid": jwtid,
		"expiresIn": expiresIn
	};
	let client_token_payload = {};
	let client_token = jwt.sign(client_token_payload, clientPrivateKey, client_token_sign_options);

	console.log("client token is " + client_token);

	// form data
	let postData = querystring.stringify({
	  "code": requestParams.code,
	  "client_id": client_id,
	  "redirect_uri": redirect_uri,
	  "grant_type": "authorization_code",
	  "client_assertion_type": "urn:ietf:params:oauth:client-assertion-type:jwt-bearer",
	  "client_assertion": client_token
	});

	console.log("request POST data is " + JSON.stringify(postData));
 
	// request option
	let options = {
	  host: iss_domain,
	  port: 443,
	  method: 'POST',
	  path: '/token',
	  rejectUnauthorized: false,
	  headers: {
		'Content-Type': 'application/x-www-form-urlencoded',
		'Content-Length': postData.length
	  }
	};
 
	console.log("request options are  " + JSON.stringify(options));
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


async function getPatient(access_token)
{

	// request option
	var options = {
	  host: iss_domain,
	  port: 443,
	  path: '/userinfo',
	  rejectUnauthorized: false,
	  headers: {
		  "Authorization": "Bearer "+access_token
	  }
	};
 
	return new Promise(function (resolve, reject) {
		// request object
		https.get(options, function (res) {
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
		}).on('error', function (err) {
		  console.log(err);
		});
	});
}
