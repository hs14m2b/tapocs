import  slot  from "../slot-002.json" with { type: "json" };
import  schedule  from "../schedule-002.json" with { type: "json" };
import { createSignedJwtForAuth, getOAuth2AccessToken } from '../../../lambdas/api_common_functions.mjs';
import { NHSNumber, OAuthAPIKey, OAuthAPIKeyName, APIDomain } from "./config.mjs";

import { v4 as uuidv4 } from 'uuid';
const HTTPS = "https://";
const apiClientPrivateKey = readFileSync('../../../certs/mhdtest001.key', 'utf8');
import { readFileSync } from 'node:fs';

async function postSlot (newSlot, accessToken)
  {
    console.log("newSlot is " + JSON.stringify(newSlot));
    let url = HTTPS + APIDomain + "/patient-data-manager/FHIR/R4/Slot";
    let options = {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + accessToken,
      'accept': 'application/fhir+json;version=1',
      'X-Request-ID': uuidv4(),
      'X-Correlation-ID': uuidv4(),
      'content-type': 'application/fhir+json'
    },
    body: JSON.stringify(newSlot)
  }
  console.log("request options are  " + JSON.stringify(options));
  console.log("url is " + url);
  let fetchResponse = await fetch(url, options);
  // Display the headers as key/value pairs
  for (const pair of fetchResponse.headers.entries()) {
    console.log(`${pair[0]}: ${pair[1]}`);
  }
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

let newSlot = JSON.parse(JSON.stringify(slot));
let scheduleId = schedule.id;
newSlot.schedule.reference = "Schedule/" + scheduleId;
//set start date to be a random date up to 100 days in the future between 9am and 5pm
let startDate = new Date();
startDate.setDate(startDate.getDate() + Math.floor((Math.random() * 90)+10));
startDate.setHours(9 + Math.floor(Math.random() * 8));
startDate.setMinutes(0+ Math.floor(Math.random() * 59));
startDate.setSeconds(0);
startDate.setMilliseconds(0);
newSlot.start = startDate.toISOString();
//set end date to be 30 minutes after start date
let endDate = new Date(startDate);
endDate.setMinutes(endDate.getMinutes() + 30);
newSlot.end = endDate.toISOString();
//set status to free
newSlot.status = "free";
let result = await postSlot(newSlot, accessToken);
console.log(result);
 
