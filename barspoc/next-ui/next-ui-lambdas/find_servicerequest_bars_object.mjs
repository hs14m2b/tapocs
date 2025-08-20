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
// hard coded for moment until a discovery mechanism can be obtained (e.g. via NRL or Tasks)
const NHSDTargetIdentifier = "eyJzeXN0ZW0iOiJodHRwczovL2ZoaXIubmhzLnVrL0lkL2Rvcy1zZXJ2aWNlLWlkIiwidmFsdWUiOiJtYXR0aGV3YnJvd24ifQ==";
const barsserviceid = "matthewbrown";
//returns a json object with headers and body properties
const findServiceRequest = async (nhsnumber, odscode, APIENVIRONMENT, APIKEYSECRET, APIKNAMEPARAM) =>
{
  let XRequestID = uuidv4();
  let subjectIdentifier = new URLSearchParams({
    "subject:identifier" : "https://fhir.nhs.uk/Id/nhs-number|" + nhsnumber}).toString();
  let url = HTTPS + APIENVIRONMENT + ".api.service.nhs.uk" + "/booking-and-referral/FHIR/R4/ServiceRequest?" + subjectIdentifier;
  
    //convert dosServiceId from json to a base64 string
  let dosServiceIdBase64 = Buffer.from(JSON.stringify({
    "system": "https://fhir.nhs.uk/Id/dos-service-id",
    "value": barsserviceid
  })).toString('base64');

  let orgJson = {
    "resourceType": "Organization",
    "identifier": [
      {
      "system":"https://fhir.nhs.uk/Id/ods-organization-code",
      "value": "X26"
      }],
     "name": "NHS ENGLAND - X26"
    }
  let endUserOrganisation = Buffer.from(JSON.stringify(orgJson)).toString('base64');

  // request option
  let options = {
    method: 'GET',
    rejectUnauthorized: false,
    headers: {
      'accept': 'application/fhir+json;version=1.1.0',
      'x-request-id': XRequestID,
      'x-correlation-id': '11C46F5F-CDEF-4865-94B2-0EE0EDCC26DA',
      'NHSD-End-User-Organisation-ODS': odscode,
      'NHSD-End-User-Organisation': endUserOrganisation,
      'content-type': 'application/fhir+json',
      'NHSD-Target-Identifier': dosServiceIdBase64
    }
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
    }
    response['body'] = await fetchResponse.json()
    return response;
  }
}

export class find_servicerequest_bars{
  constructor(){
    this.findServiceRequest = findServiceRequest;
  }
}
