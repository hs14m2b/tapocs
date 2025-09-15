import { URLSearchParams } from 'url';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
const { sign } = jwt;
const HTTPS = "https://";
import { getSecretValue, getParamValue, environmentNeedsAuth, nrlEnvironmentMapping, createSignedJwtForAuth, getOAuth2AccessToken } from './api_common_functions.mjs';


var APIKEYNAME;
var APIKEYKEY;
var apikeykeyLastRetrieved = 0;
var ACCESSTOKEN;
var ACCESSTOKENLASTRETRIEVED = 0;


const sendDocRef = async (docRef, APIENVIRONMENT, APIKEYSECRET, APIKNAMEPARAM) =>
{
  let postString = JSON.stringify(docRef);
  console.log(postString);
  let datalength = postString.length
  let XRequestID = uuidv4();
  let org = docRef.custodian.identifier.value;
  let url = HTTPS + APIENVIRONMENT + ".api.service.nhs.uk" + "/booking-and-referral/FHIR/R4/DocumentReference";
  
  // request option
  let options = {
    method: 'POST',
    rejectUnauthorized: false,
    headers: {
      'accept': 'application/fhir+json;version=1.1.0',
      'x-request-id': XRequestID,
      'x-correlation-id': '11C46F5F-CDEF-4865-94B2-0EE0EDCC26DA',
      'NHSD-End-User-Organisation-ODS': org,
      //'NHSD-End-User-Organisation': 'ewrCoCAicmVzb3VyY2VUeXBlIjogIk9yZ2FuaXphdGlvbiIsCsKgICJpZGVudGlmaWVyIjogW wrCoCDCoCB7CsKgIMKgIMKgICJodHRwczovL2ZoaXIubmhzLnVrL0lkL29kcy1vcmdhbml6YXRpb24tY29kZSIsCsKgIMK gIMKgICJ2YWx1ZSI6ICJYMjYiCgoKwqAgwqAgfSwKwqAgIm5hbWUiOiAiTkhTIEVOR0xBTkQgLSBYMjYiCsKgIF0KfQ==',
      'content-type': 'application/fhir+json',
    },
    body: postString
  };

  if (environmentNeedsAuth(APIENVIRONMENT)){
    let currentTime = Date.now();
    //get the apikey key and key name if not present or last retrieved more than 5 minutes ago
    if (!APIKEYKEY || !APIKEYNAME || ((currentTime - apikeykeyLastRetrieved) > 300000)){
      console.log("retrieving certificates from secrets manager");
      APIKEYKEY = await getSecretValue(APIKEYSECRET);
      console.log("retrieving API Key Name from Parameter Store");
      APIKEYNAME = await getParamValue(APIKNAMEPARAM);
      //set key last retrieve to now
      apikeykeyLastRetrieved = currentTime;
    }
    //get api access token if not present or last retrieved more than 4 minutes ago
    if (!ACCESSTOKEN || ((currentTime - ACCESSTOKENLASTRETRIEVED) > 240000)){
        //get api access token
      //APIKEYKEY is in format KID|KEY
      let kid = APIKEYKEY.substr(0, APIKEYKEY.indexOf("|"));
      let key = APIKEYKEY.substr(APIKEYKEY.indexOf("|")+1)
      let signedJwt = createSignedJwtForAuth(APIKEYNAME, kid, key, APIENVIRONMENT + ".api.service.nhs.uk", "/oauth2/token");
      let tokenResponse = await getOAuth2AccessToken(signedJwt, APIENVIRONMENT + ".api.service.nhs.uk", "/oauth2/token");
      //load into JSON object
      let tokenResponseJson = JSON.parse(tokenResponse);
      ACCESSTOKEN = tokenResponseJson.access_token;
      //set key last retrieve to now
      ACCESSTOKENLASTRETRIEVED = currentTime;
  }
    //add to headers
    options.headers["Authorization"] = "Bearer " + ACCESSTOKEN;
  }

  console.log("request options are  " + JSON.stringify(options));
  let fetchResponse = await fetch(url, options);
  if (!fetchResponse.ok) {
    //get the body of the response
    let responseText = await fetchResponse.text();
    console.log(responseText);
    throw new Error(`Response status: ${fetchResponse.status}`);
  }
  else {  
    console.log(fetchResponse.status);
    let response = {
      headers: {}
    }
    // Display the key/value pairs
    for (const pair of fetchResponse.headers.entries()) {
      response.headers[pair[0]] = pair[1];
      console.log(`${pair[0]}: ${pair[1]}`);
    }
    response['body'] = await fetchResponse.json()
    return response;
  }
}

export class post_document_ref_bars{
  constructor(){
    this.sendDocRef = sendDocRef;
  }
}
