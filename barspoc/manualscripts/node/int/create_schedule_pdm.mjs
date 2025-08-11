import  schedule  from "../schedule-001.json" with { type: "json" };
import { createSignedJwtForAuth, getOAuth2AccessToken } from '../../../lambdas/api_common_functions.mjs';
import { NHSNumber, OAuthAPIKey, OAuthAPIKeyName, APIDomain } from "./config.mjs";

import { v4 as uuidv4 } from 'uuid';
const HTTPS = "https://";
const apiClientPrivateKey = readFileSync('../../../certs/mhdtest001.key', 'utf8');
import { readFileSync } from 'node:fs';

async function postSchedule (newSchedule, accessToken)
  {
    console.log("newSchedule is " + JSON.stringify(newSchedule));
    let url = HTTPS + APIDomain + "/patient-data-manager/FHIR/R4/Schedule";
    let options = {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + accessToken,
      'accept': 'application/fhir+json;version=1',
      'X-Request-ID': uuidv4(),
      'X-Correlation-ID': uuidv4(),
      'content-type': 'application/fhir+json'
    },
    body: JSON.stringify(newSchedule)
  }
  console.log("request options are  " + JSON.stringify(options));
  console.log("url is " + url);
  let fetchResponse = await fetch(url, options);
  if (!fetchResponse.ok) {
    console.log(fetchResponse.status);
    return await fetchResponse.text();
  }
  else {  
    console.log(fetchResponse.status);
    return await fetchResponse.text();
  }
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

let newSchedule = JSON.parse(JSON.stringify(schedule));
let result = await postSchedule(newSchedule, accessToken);
console.log(result);
