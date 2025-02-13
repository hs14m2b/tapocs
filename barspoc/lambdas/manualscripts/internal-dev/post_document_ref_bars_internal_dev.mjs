import { createSignedJwtForAuth, getOAuth2AccessToken } from '../../api_common_functions.mjs';

import { readFileSync } from 'node:fs';

const apiClientPrivateKey = readFileSync('../../../certs/mhdtest001.key', 'utf8');
//const docRef = readFileSync('docref-plain.json', 'utf8'); //load the document reference from a file as a string
const docRef = readFileSync('docref-bars.json', 'utf8'); //load the document reference from a file as a string

import { v4 as uuidv4 } from 'uuid';
const HTTPS = "https://";
const ODSCode = "X26";
const OAuthAPIKey = "gtAI0HnGrrFherJweKLnhQRph0Ud60Cs"; //API Key for barsnrlpoc in internal-dev
const APIDomain = "internal-dev.api.service.nhs.uk";


async function sendDocRef (docRef, accessToken)
  {
    let postString = docRef;
    let XRequestID = uuidv4();
    let url = HTTPS + APIDomain + "/booking-and-referral/FHIR/R4/DocumentReference";

    // request option
    let options = {
      method: 'POST',
      rejectUnauthorized: false,
      headers: {
        'Authorization': 'Bearer '+ accessToken,
        'accept': 'application/fhir+json;version=1.1.0',
        'x-request-id': XRequestID,
        'x-correlation-id': '11C46F5F-CDEF-4865-94B2-0EE0EDCC26DA',
        //'NHSD-End-User-Organisation-ODS': ODSCode,
        //'NHSD-End-User-Organisation': 'ewrCoCAicmVzb3VyY2VUeXBlIjogIk9yZ2FuaXphdGlvbiIsCsKgICJpZGVudGlmaWVyIjogW wrCoCDCoCB7CsKgIMKgIMKgICJodHRwczovL2ZoaXIubmhzLnVrL0lkL29kcy1vcmdhbml6YXRpb24tY29kZSIsCsKgIMK gIMKgICJ2YWx1ZSI6ICJYMjYiCgoKwqAgwqAgfSwKwqAgIm5hbWUiOiAiTkhTIEVOR0xBTkQgLSBYMjYiCsKgIF0KfQ==',
        'content-type': 'application/fhir+json;version=1.1.0',
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
  "mhdtest001", apiClientPrivateKey,
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
let result = await sendDocRef(docRef, accessToken);
console.log(result);
