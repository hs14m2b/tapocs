import { createSignedJwtForAuth, getOAuth2AccessToken } from '../api_common_functions.mjs';

import { readFileSync } from 'node:fs';

const apiClientPrivateKey = readFileSync('../../certs/mhdtest001.key', 'utf8');

import { URLSearchParams } from 'url';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
const { sign } = jwt;
const HTTPS = "https://";
const ODSCode = "X26";
const OAuthAPIKey = "JE4ESpy5NzFyG5n4U6pKqk8HGXeRjLhZ"; //API Key for BaRS Demonstrator
const docRefId = "X26-b0b09869-114a-4829-ab09-87428eebf530";

let https;
try {
  https = await import('node:https');
} catch (err) {
  console.log('https support is disabled!');
}
let newId = "X26-4a3836f5-2d42-4d3e-87c1-680173b7fa5c";//uuidv4(); //Y05868-70bce845-679e-42ea-a909-30ac78ec1956
console.log(newId);


async function deleteDocRef (accessToken)
  {
    let XRequestID = uuidv4();
    // request option
    let options = {
      host: "int.api.service.nhs.uk",
      port: 443,
      method: 'DELETE',
      path: "/record-locator/producer/FHIR/R4/DocumentReference/"+docRefId,
      rejectUnauthorized: false,
      headers: {
        'Authorization': 'Bearer '+ accessToken,
        'accept': 'application/fhir+json;version=1',
        'x-request-id': XRequestID,
        'x-correlation-id': '11C46F5F-CDEF-4865-94B2-0EE0EDCC26DA',
        'NHSD-End-User-Organisation-ODS': ODSCode,//'ewrCoCAicmVzb3VyY2VUeXBlIjogIk9yZ2FuaXphdGlvbiIsCsKgICJpZGVudGlmaWVyIjogW wrCoCDCoCB7CsKgIMKgIMKgICJodHRwczovL2ZoaXIubmhzLnVrL0lkL29kcy1vcmdhbml6YXRpb24tY29kZSIsCsKgIMK gIMKgICJ2YWx1ZSI6ICJYMjYiCgoKwqAgwqAgfSwKwqAgIm5hbWUiOiAiTkhTIEVOR0xBTkQgLSBYMjYiCsKgIF0KfQ==',
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
                  "headers": res.headers,
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

        //send request with the postString json
        req.end();
    });
}

async function getAccessToken(){
  //console.log(apiClientPrivateKey);
  //let secretOrPrivateKey = createPrivateKey(apiClientPrivateKey);
  let blah = await createSignedJwtForAuth(OAuthAPIKey,
  "mhdtest001", apiClientPrivateKey,
  "int.api.service.nhs.uk", "/oauth2/token");
  //console.log(blah);
  let blah2 = await getOAuth2AccessToken(blah, "int.api.service.nhs.uk", "/oauth2/token");
  console.log(blah2);
  //load into JSON object
  let blah3 = JSON.parse(blah2);
  return blah3.access_token;
}
let accessToken = await getAccessToken();
console.log("got access token");
let result = await deleteDocRef(accessToken);
console.log(result);
