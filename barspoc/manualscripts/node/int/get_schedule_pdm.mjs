import { createSignedJwtForAuth, getOAuth2AccessToken } from '../../../lambdas/api_common_functions.mjs';
import  patient  from "../patient.json" assert { type: "json" };
import { NHSNumber, OAuthAPIKey, OAuthAPIKeyName, APIDomain, HealthcareServiceId } from "./config.mjs";

import { v4 as uuidv4 } from 'uuid';
const HTTPS = "https://";
const apiClientPrivateKey = readFileSync('../../../certs/mhdtest001.key', 'utf8');
import { readFileSync } from 'node:fs';
const scheduleId = "6eae6de9-cd7c-3a61-9f78-400ae9885dfe"; // Example schedule ID, replace with actual ID if needed

async function searchSlots (accessToken)
  {
    //let url = HTTPS + APIDomain + "/patient-data-manager/FHIR/R4/Schedule?_id=" + scheduleId + "&_include=Schedule:actor:HealthcareService";
    let url = HTTPS + APIDomain + "/patient-data-manager/FHIR/R4/Schedule?actor=HealthcareService/f597f28b-5149-3942-99f4-db669b41cfe1";
    let options = {
    method: 'GET',
    headers: {
      'Authorization': 'Bearer ' + accessToken,
      'accept': 'application/fhir+json;version=1',
      'X-Request-ID': uuidv4(),
      'X-Correlation-ID': uuidv4(),
      "product-id" : "test-product-full-access"    }
  }
  console.log("request options are  " + JSON.stringify(options));
  console.log("url is " + url);
  let fetchResponse = await fetch(url, options);
  if (!fetchResponse.ok) {
    console.log(fetchResponse.status);
    console.log(fetchResponse.statusText);
    console.log(await fetchResponse.text());
    throw new Error(`Response status: ${fetchResponse.status}`);
  }
  else {  
    console.log(fetchResponse.status);
    return await fetchResponse.json();
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

let result = await searchSlots(accessToken);
console.log(JSON.stringify(result, null , 2));
