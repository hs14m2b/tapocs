import { createSignedJwtForAuth, getOAuth2AccessToken } from '../../../lambdas/api_common_functions.mjs';

import { readFileSync } from 'node:fs';

const apiClientPrivateKey = readFileSync('../../../certs/mhdtest001.key', 'utf8');
const appointment = readFileSync('../appointment-001.json', 'utf8'); //load the appointment from a file as a string

import { v4 as uuidv4 } from 'uuid';
const HTTPS = "https://";
import { APIDomain, OAuthAPIKey, OAuthAPIKeyName, ODSCode, NHSDEndUserOrganisation, NHSDTargetIdentifier, NHSNumber } from './config.mjs';


async function sendAppointment (appointment, accessToken)
  {
    let appointmentJson = JSON.parse(appointment);
    //find the participant of type Patient and replace identifier value with NHSNumber
    let participant = appointmentJson.participant.find(participant => participant.actor.type == "Patient");
    participant.actor.identifier.value = NHSNumber;
    //convert back to string
    let postString = JSON.stringify(appointmentJson);
    console.log(postString);
    let XRequestID = uuidv4();
    let url = HTTPS + APIDomain + "/booking-and-referral/FHIR/R4/Appointment";

    // request option
    let options = {
      method: 'POST',
      rejectUnauthorized: false,
      headers: {
        'Authorization': 'Bearer '+ accessToken,
        'accept': 'application/fhir+json;version=1.1.0',
        'x-request-id': XRequestID,
        'x-correlation-id': '11C46F5F-CDEF-4865-94B2-0EE0EDCC26DA',
        'NHSD-End-User-Organisation-ODS': ODSCode,
        'NHSD-End-User-Organisation': NHSDEndUserOrganisation,
        'content-type': 'application/fhir+json',
        'NHSD-Target-Identifier': NHSDTargetIdentifier,
        'NHSD-ID-Token': "dummyvalue"
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
let result = await sendAppointment(appointment, accessToken);
console.log(result);
 
