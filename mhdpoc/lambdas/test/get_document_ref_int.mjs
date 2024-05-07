import { createSignedJwtForAuth, getOAuth2AccessToken } from '../api_common_functions.mjs';

import { createPrivateKey } from 'node:crypto';
import { readFileSync } from 'node:fs';

const apiClientPrivateKey = readFileSync('../../certs/mhdconvint1.key', 'utf8');

import { URLSearchParams } from 'url';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
const { sign } = jwt;
const HTTPS = "https://";

let https;
try {
  https = await import('node:https');
} catch (err) {
  console.log('https support is disabled!');
}
let drId = "Y05868-" + "65752748-e615-45ce-b3e6-ce274e70e6e2";//"1e404af3-077f-4bee-b7a6-a9be97e1ce01";

async function getDocRef (drId, access_token) 
  {
    let XRequestID = uuidv4();
    // request option
    let options = {
      host: "int.api.service.nhs.uk",
      port: 443,
      method: 'GET',
      path: "/record-locator/producer/FHIR/R4/DocumentReference/" + drId,
      rejectUnauthorized: false,
      headers: {
        'Authorization': 'Bearer '+ access_token,
        'accept': 'application/fhir+json;version=1',
        'X-Request-ID': XRequestID,
        'NHSD-End-User-Organisation-ODS': 'Y05868'
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
                let response = {
                  "status": res.statusCode,
                  "body": result
                }
                resolve(response);
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
         
        //send request
        req.end();
    });
  }

  async function getAccessToken(){
    //console.log(apiClientPrivateKey);
    //let secretOrPrivateKey = createPrivateKey(apiClientPrivateKey);
    let blah = await createSignedJwtForAuth("kqU7ldmK4wVoDQA6c76bNsAFMzw8SmGQ", 
    "mhdconvint1", apiClientPrivateKey,
    "int.api.service.nhs.uk", "/oauth2/token");
    //console.log(blah);
    let blah2 = await getOAuth2AccessToken(blah, "int.api.service.nhs.uk", "/oauth2/token");
    console.log(blah2);
    //load into JSON object
    let blah3 = JSON.parse(blah2);
    return blah3.access_token;
  }

let access_token = await getAccessToken();
let result = await getDocRef(drId, access_token);
console.log(result);