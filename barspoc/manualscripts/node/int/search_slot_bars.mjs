import { createSignedJwtForAuth, getOAuth2AccessToken } from '../../../lambdas/api_common_functions.mjs';

import { readFileSync } from 'node:fs';

const apiClientPrivateKey = readFileSync('../../../certs/mhdtest001.key', 'utf8');

import { v4 as uuidv4 } from 'uuid';
import { APIDomain, OAuthAPIKey, OAuthAPIKeyName, ODSCode, NHSDEndUserOrganisation, NHSDTargetIdentifier, NHSNumber } from './config.mjs';
const HTTPS = "https://";

async function searchSlots (accessToken)
  {
    let slotSearchParams = new URLSearchParams({
      "schedule.actor" : "HealthcareService/9f00342d-70de-38d5-9176-af97f1ba1b3d", "status": "free" }).toString();
    let url = HTTPS + APIDomain + "/booking-and-referral/FHIR/R4/Slot?" + slotSearchParams;
    let XRequestID = uuidv4();
    // request option
    let options = {
      method: 'GET',
      rejectUnauthorized: false,
      headers: {
        'Authorization': 'Bearer '+ accessToken,
        'accept': 'application/fhir+json;version=1.1.0',
        'x-request-id': XRequestID,
        'x-correlation-id': '11C46F5F-CDEF-4865-94B2-0EE0EDCC26DA',
        'NHSD-End-User-Organisation-ODS': ODSCode,
        'NHSD-End-User-Organisation': NHSDEndUserOrganisation,
        'NHSD-Target-Identifier': NHSDTargetIdentifier,
        'NHSD-ID-Token': "dummyvalue"
      }
    };

    console.log("request options are  " + JSON.stringify(options, null, 4));
    console.log("url is " + url);
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
      console.log("Number of results: " + responseJson.total);
      if (responseJson.total > 0) {
        for (let i = 0; i < responseJson.total; i++) {
          console.log("Start Time: " + responseJson.entry[i].resource.start);
          console.log("End Time: " + responseJson.entry[i].resource.end);
        }
    }
  }
    return fetchResponse.status
}

async function getAccessToken(){
  let blah = await createSignedJwtForAuth(OAuthAPIKey,
  OAuthAPIKeyName, apiClientPrivateKey,
  APIDomain, "/oauth2/token");
  let blah2 = await getOAuth2AccessToken(blah, APIDomain, "/oauth2/token");
  console.log(blah2);
  //load into JSON object
  let blah3 = JSON.parse(blah2);
  return blah3.access_token;
}
let accessToken = await getAccessToken();
console.log("got access token");
let result = await searchSlots(accessToken);
console.log(result);
 
