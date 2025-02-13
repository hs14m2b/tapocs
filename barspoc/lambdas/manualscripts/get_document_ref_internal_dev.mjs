import { createSignedJwtForAuth, getOAuth2AccessToken } from '../api_common_functions.mjs';

import { readFileSync } from 'node:fs';

const apiClientPrivateKey = readFileSync('../../certs/mhdtest001.key', 'utf8');

import { URLSearchParams } from 'url';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
const { sign } = jwt;
const HTTPS = "https://";
const ODSCode = "X26";
const OAuthAPIKey = "gtAI0HnGrrFherJweKLnhQRph0Ud60Cs"; //API Key for barsnrlpoc in internal-dev
const APIDomain = "internal-dev.api.service.nhs.uk";
const docRefId = "X26-f7a2ed6e-ec29-4413-8509-1fa26a36308d";

let https;
try {
  https = await import('node:https');
} catch (err) {
  console.log('https support is disabled!');
}

async function getDocRef (accessToken)
  {
    let url = HTTPS + APIDomain + "/record-locator/consumer/FHIR/R4/DocumentReference/" + docRefId;
    let XRequestID = uuidv4();
    // request option
    let options = {
      method: 'GET',
      rejectUnauthorized: false,
      headers: {
        'Authorization': 'Bearer '+ accessToken,
        'accept': 'application/fhir+json;version=1',
        'x-request-id': XRequestID,
        'x-correlation-id': '11C46F5F-CDEF-4865-94B2-0EE0EDCC26DA',
        'NHSD-End-User-Organisation-ODS': ODSCode,
      }
    };

    console.log("request options are  " + JSON.stringify(options, null, 4));
    let fetchResponse = await fetch(url, options);
    if (!fetchResponse.ok) {
      //get the body of the response
      let responseText = await fetchResponse.text();
      console.log(responseText);
      throw new Error(`Response status: ${fetchResponse.status}`);
    }
    else {  
      console.log(fetchResponse.status);
      // Display the key/value pairs
      for (const pair of fetchResponse.headers.entries()) {
        console.log(`${pair[0]}: ${pair[1]}`);
      }
      let responseJson = await fetchResponse.json();
      console.log(JSON.stringify(responseJson, null, 4));
    }
    return fetchResponse.status
}

async function getAccessToken(){
  //console.log(apiClientPrivateKey);
  //let secretOrPrivateKey = createPrivateKey(apiClientPrivateKey);
  let blah = await createSignedJwtForAuth(OAuthAPIKey,
  "mhdtest001", apiClientPrivateKey,
  APIDomain, "/oauth2/token");
  //console.log(blah);
  let blah2 = await getOAuth2AccessToken(blah, APIDomain, "/oauth2/token");
  console.log(blah2);
  //load into JSON object
  let blah3 = JSON.parse(blah2);
  return blah3.access_token;
}
let accessToken = await getAccessToken();
console.log("got access token");
let result = await getDocRef(accessToken);
console.log(result);
