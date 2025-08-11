import { createSignedJwtForAuth, getOAuth2AccessToken } from '../../../lambdas/api_common_functions.mjs';
import { NHSNumber, OAuthAPIKey, OAuthAPIKeyName, APIDomain } from "./config.mjs";

import { v4 as uuidv4 } from 'uuid';
const HTTPS = "https://";
const apiClientPrivateKey = readFileSync('../../../certs/mhdtest001.key', 'utf8');
import { readFileSync } from 'node:fs';

async function deleteAppointment (versionId, accessToken)
  {
    //format http header value of If-Match to be "W/\"1\""
    let ifMatch = "W/\"" + versionId + "\"";
    console.log("ifMatch is " + ifMatch);
    let url = HTTPS + APIDomain + "/patient-data-manager/FHIR/R4/Appointment/" + "c4140094-8539-3ff0-8c62-a29722c1ea74";
    let options = {
    method: 'DELETE',
    headers: {
      'Authorization': 'Bearer ' + accessToken,
      'accept': 'application/fhir+json;version=1',
      'X-Request-ID': uuidv4(),
      'X-Correlation-ID': uuidv4(),
      'If-Match': ifMatch,
      'content-type': 'application/fhir+json'
    }
  }
  console.log("request options are  " + JSON.stringify(options));
  console.log("url is " + url);
  let fetchResponse = await fetch(url, options);
  if (!fetchResponse.ok) {
    console.log(fetchResponse.status);
    console.log(await fetchResponse.text());
    throw new Error(`Response status: ${fetchResponse.status}`);
  }
  else {  
    console.log(fetchResponse.status);
    return fetchResponse.status;
  }
}

async function getAppointment (accessToken)
  {
    let url = HTTPS + APIDomain + "/patient-data-manager/FHIR/R4/Appointment/" + "c4140094-8539-3ff0-8c62-a29722c1ea74";
    let options = {
    method: 'GET',
    headers: {
      'Authorization': 'Bearer ' + accessToken,
      'accept': 'application/fhir+json;version=1',
      'X-Request-ID': uuidv4(),
      'X-Correlation-ID': uuidv4(),
      'content-type': 'application/fhir+json'
    }
  }
  console.log("request options are  " + JSON.stringify(options));
  console.log("url is " + url);
  let fetchResponse = await fetch(url, options);
  if (!fetchResponse.ok) {
    console.log(fetchResponse.status);
    console.log(await fetchResponse.text());
    throw new Error(`Response status: ${fetchResponse.status}`);
  }
  else {  
    console.log(fetchResponse.status);
    // Display the headers as key/value pairs
    for (const pair of fetchResponse.headers.entries()) {
      console.log(`${pair[0]}: ${pair[1]}`);
    }
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

let result = await getAppointment(accessToken);
//get the meta versionId from the appointment
let versionId = result.meta.versionId;
console.log("versionId is " + versionId);
//delete the appointment
result = await deleteAppointment(versionId, accessToken);
console.log(JSON.stringify(result));
 
