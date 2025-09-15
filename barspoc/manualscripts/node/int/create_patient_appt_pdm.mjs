import  appointment  from "../appointment-001.json" assert { type: "json" }; 
import { createSignedJwtForAuth, getOAuth2AccessToken } from '../../../lambdas/api_common_functions.mjs';
import { NHSNumber, OAuthAPIKey, OAuthAPIKeyName, APIDomain } from "./config.mjs";

import { v4 as uuidv4 } from 'uuid';
const HTTPS = "https://";
const apiClientPrivateKey = readFileSync('../../../certs/mhdtest001.key', 'utf8');
import { readFileSync } from 'node:fs';

async function postAppointment (newAppointment, accessToken)
  {
    console.log("newAppointment is " + JSON.stringify(newAppointment));
    let url = HTTPS + APIDomain + "/patient-data-manager/FHIR/R4/Appointment";
    let options = {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + accessToken,
      'accept': 'application/fhir+json;version=1',
      'X-Request-ID': uuidv4(),
      'X-Correlation-ID': uuidv4(),
      'content-type': 'application/fhir+json'
    },
    body: JSON.stringify(newAppointment)
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

let newAppointment = JSON.parse(JSON.stringify(appointment));
//find the participant actor identifier and replace with NHSNumber
//loop through the participant array in the appointment object
for (let i = 0; i < newAppointment.participant.length; i++) {
  //find the actor object with type = Patient
  if (newAppointment.participant[i].actor.type === "Patient") {
    //replace the identifier value with NHSNumber
    newAppointment.participant[i].actor.identifier.value = NHSNumber;
  }
}

let result = await postAppointment(newAppointment, accessToken);
console.log(JSON.stringify(result));
 
