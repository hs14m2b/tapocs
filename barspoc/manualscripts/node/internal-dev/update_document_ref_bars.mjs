import { createSignedJwtForAuth, getOAuth2AccessToken } from '../../../lambdas/api_common_functions.mjs';

import { readFileSync } from 'node:fs';

const apiClientPrivateKey = readFileSync('../../../certs/mhdtest001.key', 'utf8');
//const docRef = readFileSync('docref-plain.json', 'utf8'); //load the document reference from a file as a string
const docRef = readFileSync('../docref-bars.json', 'utf8'); //load the document reference from a file as a string

import { v4 as uuidv4 } from 'uuid';
const HTTPS = "https://";
import { APIDomain, OAuthAPIKey, OAuthAPIKeyName, NHSDEndUserOrganisation, NHSDTargetIdentifier } from './config.mjs';
const docRefId = "V4T0L-86fe42b5-6d7c-4e49-938a-6e4cbf5362ec";
const ODSCode = "V4T0L";
async function updateDocRef (accessToken)
  {
    let docRefJson = JSON.parse(docRef);
    docRefJson.id = docRefId;
    let newPeriod = {
      "start": "2025-04-15T09:50:00Z",
      "end": "2025-04-15T10:00:00Z"
    };
    docRefJson.context.period = newPeriod;

    let postString = JSON.stringify(docRefJson);
    let XRequestID = uuidv4();
    let url = HTTPS + APIDomain + "/booking-and-referral/FHIR/R4/DocumentReference/" + docRefId;

    // request option
    let options = {
      method: 'PUT',
      rejectUnauthorized: false,
      headers: {
        'Authorization': 'Bearer '+ accessToken,
        'accept': 'application/fhir+json;version=1.1.0',
        'x-request-id': XRequestID,
        'x-correlation-id': '11C46F5F-CDEF-4865-94B2-0EE0EDCC26DA',
        'NHSD-End-User-Organisation-ODS': ODSCode,
        //'NHSD-End-User-Organisation': 'ewrCoCAicmVzb3VyY2VUeXBlIjogIk9yZ2FuaXphdGlvbiIsCsKgICJpZGVudGlmaWVyIjogW wrCoCDCoCB7CsKgIMKgIMKgICJodHRwczovL2ZoaXIubmhzLnVrL0lkL29kcy1vcmdhbml6YXRpb24tY29kZSIsCsKgIMK gIMKgICJ2YWx1ZSI6ICJYMjYiCgoKwqAgwqAgfSwKwqAgIm5hbWUiOiAiTkhTIEVOR0xBTkQgLSBYMjYiCsKgIF0KfQ==',
        'content-type': 'application/fhir+json',
      },
      body: postString
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
    }
    return fetchResponse.status
}

async function getAccessToken(){
  //let secretOrPrivateKey = createPrivateKey(apiClientPrivateKey);
  let blah = await createSignedJwtForAuth(OAuthAPIKey,
    OAuthAPIKeyName, apiClientPrivateKey,
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
let result = await updateDocRef(accessToken);
console.log(result);
