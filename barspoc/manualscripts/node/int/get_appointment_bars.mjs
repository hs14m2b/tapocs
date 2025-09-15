import { createSignedJwtForAuth, getOAuth2AccessToken } from '../../../lambdas/api_common_functions.mjs';
import { createPrivateKey } from 'node:crypto';
import { readFileSync } from 'node:fs';

const apiClientPrivateKey = readFileSync('../../../certs/mhdtest001.key', 'utf8');

import { v4 as uuidv4 } from 'uuid';
const HTTPS = "https://";
import { APIDomain, OAuthAPIKey, OAuthAPIKeyName, ODSCode, NHSDEndUserOrganisation, NHSDTargetIdentifier } from './config.mjs';

let appointmentId = "568d74ac-00a6-3871-87e7-d97ddaff3299";//"1db9d37d-579d-424e-b44a-1f201923de22";

  async function fetchAppointment (appointmentId, access_token)
  {
    let XRequestID = uuidv4();
    let url = HTTPS + APIDomain + "/booking-and-referral/FHIR/R4/Appointment/" + appointmentId;
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
        'NHSD-Target-Identifier': NHSDTargetIdentifier,
        'NHSD-ID-Token': "dummyvalue"
      }
    }
    console.log("request options are  " + JSON.stringify(options));
    console.log("url is " + url);
    let fetchResponse = await fetch(url, options);
    if (!fetchResponse.ok) {
      console.log(fetchResponse.status);
      let responseJson = await fetchResponse.json();
      console.log(JSON.stringify(responseJson, null, 4));
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
    "mhdtest001", apiClientPrivateKey,
    APIDomain, "/oauth2/token");
    //console.log(blah);
    let blah2 = await getOAuth2AccessToken(blah, APIDomain, "/oauth2/token");
    console.log(blah2);
    //load into JSON object
    let blah3 = JSON.parse(blah2);
    return blah3.access_token;
  }

let access_token = await getAccessToken();
let result = await fetchAppointment(appointmentId, access_token);
console.log(JSON.stringify(result, null, 4));
 
