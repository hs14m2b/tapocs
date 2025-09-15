import  appointment  from "../appointment-updated.json" with { type: "json" };
import { createSignedJwtForAuth, getOAuth2AccessToken } from '../../../lambdas/api_common_functions.mjs';
import { NHSNumber, OAuthAPIKey, OAuthAPIKeyName, APIDomain } from "./config.mjs";

import { v4 as uuidv4 } from 'uuid';
const HTTPS = "https://";
const apiClientPrivateKey = readFileSync('../../../certs/mhdtest001.key', 'utf8');
import { readFileSync } from 'node:fs';

async function getETag(newAppointment, accessToken) {
  let url = HTTPS + APIDomain + "/patient-data-manager/FHIR/R4/Appointment/" + newAppointment.id;
  let options = {
    method: 'GET',
    headers: {
      'Authorization': 'Bearer ' + accessToken,
      'accept': 'application/fhir+json;version=1',
      'X-Request-ID': uuidv4(),
      'X-Correlation-ID': uuidv4()
    }
  };
  let fetchResponse = await fetch(url, options);
  if (!fetchResponse.ok) {
    console.log(fetchResponse.status);
    return await fetchResponse.text();
  } else {
    console.log(fetchResponse.status);
    return fetchResponse.headers.get('ETag');
  }
}

async function postAppointment (newAppointment, accessToken, eTag)
  {
    console.log("newAppointment is " + JSON.stringify(newAppointment));
    let id = newAppointment.id;
    let url = HTTPS + APIDomain + "/patient-data-manager/FHIR/R4/Appointment/" + id;
    let options = {
    method: 'PUT',
    headers: {
      'Authorization': 'Bearer ' + accessToken,
      'accept': 'application/fhir+json;version=1',
      'X-Request-ID': uuidv4(),
      'X-Correlation-ID': uuidv4(),
      'content-type': 'application/fhir+json',
      'If-Match': eTag // Use the ETag from the GET request
    },
    body: JSON.stringify(newAppointment)
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

let newAppointment = JSON.parse(JSON.stringify(appointment));
let eTag = await getETag(newAppointment, accessToken);
console.log("eTag is " + eTag);

let result = await postAppointment(newAppointment, accessToken, eTag);
console.log(result);
 
