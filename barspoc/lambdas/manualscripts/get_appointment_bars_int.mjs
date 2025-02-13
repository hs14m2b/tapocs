import { createSignedJwtForAuth, getOAuth2AccessToken } from '../api_common_functions.mjs';
import { createPrivateKey } from 'node:crypto';
import { readFileSync } from 'node:fs';

const apiClientPrivateKey = readFileSync('../../certs/mhdtest001.key', 'utf8');

import { URLSearchParams } from 'url';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
const { sign } = jwt;
const HTTPS = "https://";
const APIDomain = "int.api.service.nhs.uk";

let https;
try {
  https = await import('node:https');
} catch (err) {
  console.log('https support is disabled!');
}
let appointmentId = "4a3836f5-2d42-4d3e-87c1-680173b7fa5c";


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
        'NHSD-Target-Identifier': 'eyJzeXN0ZW0iOiJodHRwczovL2ZoaXIubmhzLnVrL0lkL2Rvcy1zZXJ2aWNlLWlkIiwidmFsdWUiOiJtYXR0aGV3YnJvd24ifQ=='
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
    //console.log(apiClientPrivateKey);
    //let secretOrPrivateKey = createPrivateKey(apiClientPrivateKey);
    let blah = await createSignedJwtForAuth("JE4ESpy5NzFyG5n4U6pKqk8HGXeRjLhZ",
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
