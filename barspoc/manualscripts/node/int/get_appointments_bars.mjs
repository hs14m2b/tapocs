import { createSignedJwtForAuth, getOAuth2AccessToken } from '../../../lambdas/api_common_functions.mjs';
import { createPrivateKey } from 'node:crypto';
import { readFileSync } from 'node:fs';

const apiClientPrivateKey = readFileSync('../../../certs/mhdtest001.key', 'utf8');

import { v4 as uuidv4 } from 'uuid';
const HTTPS = "https://";
import { APIDomain, OAuthAPIKey, OAuthAPIKeyName, ODSCode, NHSDEndUserOrganisation, NHSDTargetIdentifier, NHSNumber } from './config.mjs';

// returns a Bundle with the DocumentReference resources
async function getDocRefs (accessToken)
  {
    let subjectIdentifier = new URLSearchParams({
      "subject:identifier" : "https://fhir.nhs.uk/Id/nhs-number|" + NHSNumber, 
      "type" : "http://snomed.info/sct|749001000000101", 
      "category": "http://snomed.info/sct|419891008"}).toString();
    let url = HTTPS + APIDomain + "/booking-and-referral/FHIR/R4/DocumentReference?" + subjectIdentifier;
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
      console.log("Number of results: " + responseJson.total);
      if (responseJson.total > 0) {
        for (let i = 0; i < responseJson.total; i++) {
          console.log("Document Reference ID: " + responseJson.entry[i].resource.id);
          console.log("Custodian: " + responseJson.entry[i].resource.custodian.identifier.value);
        }
      }
      return responseJson;
  }
    return fetchResponse.status
}

async function fetchAppointments (appointmentIds, dosServiceId, access_token)
{
  let XRequestID = uuidv4();
  //convert dosServiceId from json to a base64 string
  let dosServiceIdBase64 = Buffer.from(JSON.stringify(dosServiceId)).toString('base64');
  //generate comma separated list of appointment IDs
  let appointmentIdsQuery = appointmentIds.join(",");
  let url = HTTPS + APIDomain + "/booking-and-referral/FHIR/R4/Appointment?_id=" + appointmentIdsQuery;
  // request option
  let options = {
    method: 'GET',
    headers: {
      'Authorization': 'Bearer '+ access_token,
      'accept': 'application/fhir+json;version=1',
      'X-Request-ID': XRequestID,
      'X-Correlation-ID': XRequestID,
      //'NHSD-End-User-Organisation-ODS': 'ewrCoCAicmVzb3VyY2VUeXBlIjogIk9yZ2FuaXphdGlvbiIsCsKgICJpZGVudGlmaWVyIjogW wrCoCDCoCB7CsKgIMKgIMKgICJodHRwczovL2ZoaXIubmhzLnVrL0lkL29kcy1vcmdhbml6YXRpb24tY29kZSIsCsKgIMK gIMKgICJ2YWx1ZSI6ICJYMjYiCgoKwqAgwqAgfSwKwqAgIm5hbWUiOiAiTkhTIEVOR0xBTkQgLSBYMjYiCsKgIF0KfQ==',
      'NHSD-End-User-Organisation': NHSDEndUserOrganisation,
      'NHSD-Target-Identifier': dosServiceIdBase64,
      'NHSD-ID-Token': "dummyvalue"
    }
  }
  console.log("request options are  " + JSON.stringify(options));
  console.log("url is " + url);
  let fetchResponse = await fetch(url, options);
  if (!fetchResponse.ok) {
    throw new Error(`Response status: ${fetchResponse.status}`);
  }
  else {  
    console.log(fetchResponse.status);
    let responseJson = await fetchResponse.json();
    console.log(JSON.stringify(responseJson, null, 4));
    return responseJson;
  }
}

async function getAccessToken(){
  let blah = await createSignedJwtForAuth(OAuthAPIKey,
  OAuthAPIKeyName, apiClientPrivateKey,
  APIDomain, "/oauth2/token");
  //console.log(blah);
  let blah2 = await getOAuth2AccessToken(blah, APIDomain, "/oauth2/token");
  //console.log(blah2);
  //load into JSON object
  let blah3 = JSON.parse(blah2);
  return blah3.access_token;
}

let access_token = await getAccessToken();
let docRefs = await getDocRefs(access_token);
console.log("Number of results: " + docRefs.total);
let appointmentIds = [];
let dosServiceId = "";
for (let i = 0; i < docRefs.total; i++) {
  let docRef = docRefs.entry[i].resource;
  //find the identifier with the system https://fhir.nhs.uk/Id/BaRS-Identifier
  let appointmentId = docRef.identifier.find(identifier => identifier.system == "https://fhir.nhs.uk/Id/BaRS-Identifier");
  //find the identifier with the system https://fhir.nhs.uk/Id/dos-service-id
  dosServiceId = docRef.identifier.find(identifier => identifier.system == "https://fhir.nhs.uk/Id/dos-service-id");

  if (appointmentId) {
    appointmentId = appointmentId.value;
    appointmentIds.push(appointmentId);
  }
  else {
    console.log("No appointment ID found in DocumentReference " + docRef.id);
    continue;
  }
  if (!dosServiceId) {
    console.log("No DOS Service ID found in DocumentReference " + docRef.id);
  }
}
if (dosServiceId && appointmentIds.length > 0) {
  console.log("Appointment IDs: " + JSON.stringify(appointmentIds));
  console.log("DOS Service ID: " + JSON.stringify(dosServiceId));
  let result = await fetchAppointments(appointmentIds, dosServiceId, access_token);
  console.log(JSON.stringify(result, null, 4));
}
//console.log(JSON.stringify(result, null, 4));
