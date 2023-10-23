import {createSignedJwtForAuth, getOAuth2AccessToken} from "./api_common_functions.mjs";
let fs = await import('node:fs');
let https;
try {
  https = await import('node:https');
} catch (err) {
  console.error('https support is disabled!');
}
let apiKey = "Gy4tfYPuNAoyIEFU1cYvZabTAmZb2nD2"; //covid cert status app - integration environment
let kid = "test-001";
const privatekey = fs.readFileSync('./api_client_RS512.key', 'ascii');
let APIMDOMAIN = "int.api.service.nhs.uk";
let APIAUTHENDPOINT = "https://int.api.service.nhs.uk/oauth2/token";
let APIAUTHPATH = "/oauth2/token";
let AWSREGIONNAME = "eu-west-2";

async function get_access_token_via_client_credentials(apiKey, kid, privatekey, APIMDOMAIN, APIAUTHPATH)
{
    console.log("getting access token via client credentials");
    let signed_jwt = createSignedJwtForAuth(apiKey, kid, privatekey, APIMDOMAIN, APIAUTHPATH);
    console.log("have generated the signed jwt");
    let oauth_response = await getOAuth2AccessToken(signed_jwt, APIMDOMAIN, APIAUTHPATH);
    console.log("have obtained oauth response");
    return oauth_response;
}

async function send_message_batch (access_token)
{

    let message_batch = {
        "data": {
          "type": "MessageBatch",
          "attributes": {
            "routingPlanId": "b838b13c-f98c-4def-93f0-515d4e4f4ee1",
            "messageBatchReference": "da0b1495-c7cb-468c-9d81-07dee089d728",
            "messages": [
              {
                "messageReference": "703b8008-545d-4a04-bb90-1f2946ce1575",
                "recipient": {
                  "nhsNumber": "9686368973",
                  "dateOfBirth": "1968-02-12"
                },
                "personalisation": {}
              }
            ]
          }
        }
    };
    let message_batch_string = JSON.stringify(message_batch,null,0);
  
    //console.log("request POST data is " + JSON.stringify(postData));
    // request option
	let options = {
        host: "int.api.service.nhs.uk",
        port: 443,
        method: 'POST',
        path: "/comms/v1/message-batches",
        rejectUnauthorized: false,
        headers: {
          'Accept' : 'application/json',
          'Authorization': "Bearer "+access_token,
          'Content-Type': 'application/json',
          'Content-Length': message_batch_string.length
        }
      };
   
      console.log("request options are  " + JSON.stringify(options));
      return new Promise(function (resolve, reject) {
          // request object
          var req = https.request(options, function (res) {
              var result = '';
              console.log("HTTP status code: " + res.statusCode);
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
          req.write(message_batch_string);
          req.end();
      });
};

console.log("getting access token");
let oauth_response =  JSON.parse(await get_access_token_via_client_credentials(apiKey, kid, privatekey, APIMDOMAIN, APIAUTHPATH)) ;
let {access_token} = oauth_response;
console.log("access token is " + access_token);
let response = await send_message_batch(access_token);

