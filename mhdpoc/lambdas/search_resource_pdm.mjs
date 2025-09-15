import { URLSearchParams } from 'url';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
const { sign } = jwt;
const HTTPS = "https://";
import { getSecretValue, getParamValue, environmentNeedsAuth, getParameterCaseInsensitive, createSignedJwtForAuth, getOAuth2AccessToken, getOAuth2AccessTokenViaTokenExchange } from './api_common_functions.mjs';


var APIKEYNAME;
var APIKEYKEY;
var apikeykeyLastRetrieved = 0;
var ACCESSTOKEN;
var ACCESSTOKENLASTRETRIEVED = 0;
var IDENTITYTOKEN;

//returns a json object with headers and body properties
export const searchResource = async (querystringValues, resourceType, org, APIENVIRONMENT, APIKEYSECRET, APIKNAMEPARAM) =>
{
  let queryStrings = new URLSearchParams(querystringValues).toString();
  let url = HTTPS + APIENVIRONMENT + ".api.service.nhs.uk" + "/patient-data-manager/FHIR/R4/" + resourceType + "?" + queryStrings;
  let XRequestID = uuidv4();

  // request option
  let options = {
    method: 'GET',
    rejectUnauthorized: false,
    headers: {
      'accept': 'application/fhir+json;version=1',
      'x-request-id': XRequestID,
      'x-correlation-id': XRequestID
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
  console.log("url is " + url);
  let pdmResponse = {
    "status": 0,
    "headers": {},
    "body": {}
  };
  let fetchResponse = await fetch(url, options);
  if (!fetchResponse.ok) {
    //get the body of the response
    let responseText = await fetchResponse.text();
    console.log(responseText);
    pdmResponse['status'] = fetchResponse.status;
    pdmResponse['body'] = responseText;
    return pdmResponse;
  }
  else {  
    console.log(fetchResponse.status);
    pdmResponse['status'] = fetchResponse.status;
    // Display the header key/value pairs
    for (const pair of fetchResponse.headers.entries()) {
      //console.log(`${pair[0]}: ${pair[1]}`);
      pdmResponse['headers'][pair[0]] = pair[1];
    }
    let responseJson = await fetchResponse.text();
    console.log(JSON.stringify(responseJson, null, 4));
    pdmResponse['body'] = responseJson;
    //return the created resource
    return pdmResponse;
  }
}

function delay(time) {
  return new Promise(resolve => setTimeout(resolve, time));
}

export const searchResourceWithRetry = async (maxDuration, querystringValues, resourceType, org, APIENVIRONMENT, APIKEYSECRET, APIKNAMEPARAM) =>
{
  let startTime=Date.now();
  let pauseTime=1000;
  let currentTime=Date.now();
  let elapsedTime=currentTime-startTime;
  elapsedTime += pauseTime;

  let searchResult = await searchResource(querystringValues, resourceType, org, APIENVIRONMENT, APIKEYSECRET, APIKNAMEPARAM);
  let searchsetBundle = JSON.parse(searchResult.body);
  while (true){
    //if no entry values....
    if (!searchsetBundle.entry)
    {
      console.log("not found anything in pdm - waiting a bit and trying again");
      currentTime=Date.now();
      if (maxDuration < (currentTime-startTime+pauseTime))
      {
        console.log("max duration would be exceeded in a pause - breaking loop");
        break;
      }
      await delay(pauseTime);
      console.log("doubling pause time for next loop");
      pauseTime = pauseTime*2;
      searchResult = await searchResource(querystringValues, resourceType, org, APIENVIRONMENT, APIKEYSECRET, APIKNAMEPARAM);
      searchsetBundle = JSON.parse(searchResult.body);
    }
    else{
      console.log("searchset contains entry values");
      break;
    }
  }
  return searchResult;
}

export const getResource = async (id, resourceType, APIENVIRONMENT, APIKEYSECRET, APIKNAMEPARAM) =>
  {
    let XRequestID = uuidv4();
    let url = HTTPS + APIENVIRONMENT + ".api.service.nhs.uk" + "/patient-data-manager/FHIR/R4/" + resourceType + "/" + id;
    // request option
    let options = {
      method: 'GET',
      rejectUnauthorized: false,
      headers: {
        'accept': 'application/fhir+json;version=1',
        'x-request-id': XRequestID,
        'x-correlation-id': XRequestID
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
    console.log("url is " + url);

    let pdmResponse = {
      "status": 0,
      "headers": {},
      "body": {}
    };
    let fetchResponse = await fetch(url, options);
    if (!fetchResponse.ok) {
      //get the body of the response
      let responseText = await fetchResponse.text();
      console.log(responseText);
      pdmResponse['status'] = fetchResponse.status;
      pdmResponse['body'] = responseText;
      return pdmResponse;
      //throw new Error(`Response status: ${fetchResponse.status}`);
    }
    else {  
      console.log(fetchResponse.status);
      pdmResponse['status'] = fetchResponse.status;
      // Display the header key/value pairs
      for (const pair of fetchResponse.headers.entries()) {
        //console.log(`${pair[0]}: ${pair[1]}`);
        pdmResponse['headers'][pair[0]] = pair[1];
      }
      let responseJson = await fetchResponse.text();
      console.log(JSON.stringify(responseJson, null, 4));
      pdmResponse['body'] = responseJson;
      //return the created resource
      return pdmResponse;
    }
}

export const getResourcePatient = async (id, resourceType, APIENVIRONMENT, APIKEYSECRET, APIKNAMEPARAM, identity_token) =>
{
  console.log("getResourcePatient called with id " + id + " and resourceType " + resourceType);
  let XRequestID = uuidv4();
  let url = HTTPS + APIENVIRONMENT + ".api.service.nhs.uk" + "/patient-data-manager/FHIR/R4/" + resourceType + "/" + id;
  // request option
  let options = {
    method: 'GET',
    rejectUnauthorized: false,
    headers: {
      'accept': 'application/fhir+json;version=1',
      'x-request-id': XRequestID,
      'x-correlation-id': XRequestID
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
    //get api access token if not present or last retrieved more than 4 minutes ago or if the identity token has changed
    if (!IDENTITYTOKEN || (IDENTITYTOKEN != identity_token)){
      console.log("identity token has changed - resetting access token");
      IDENTITYTOKEN = identity_token;
      ACCESSTOKEN = null;
    }
    if (!ACCESSTOKEN || ((currentTime - ACCESSTOKENLASTRETRIEVED) > 240000)){
      //get api access token
      //APIKEYKEY is in format KID|KEY
      let kid = APIKEYKEY.substr(0, APIKEYKEY.indexOf("|"));
      let key = APIKEYKEY.substr(APIKEYKEY.indexOf("|")+1)
      let signedJwt = createSignedJwtForAuth(APIKEYNAME, kid, key, APIENVIRONMENT + ".api.service.nhs.uk", "/oauth2/token");
      let tokenResponse = await getOAuth2AccessTokenViaTokenExchange(signedJwt, identity_token, APIENVIRONMENT + ".api.service.nhs.uk", "/oauth2/token");
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
  console.log("url is " + url);

  let pdmResponse = {
    "status": 0,
    "headers": {},
    "body": {}
  };
  let fetchResponse = await fetch(url, options);
  if (!fetchResponse.ok) {
    //get the body of the response
    let responseText = await fetchResponse.text();
    console.log(responseText);
    pdmResponse['status'] = fetchResponse.status;
    pdmResponse['body'] = responseText;
    return pdmResponse;
    //throw new Error(`Response status: ${fetchResponse.status}`);
  }
  else {  
    console.log(fetchResponse.status);
    pdmResponse['status'] = fetchResponse.status;
    // Display the header key/value pairs
    for (const pair of fetchResponse.headers.entries()) {
      //console.log(`${pair[0]}: ${pair[1]}`);
      pdmResponse['headers'][pair[0]] = pair[1];
    }
    let responseJson = await fetchResponse.text();
    console.log(JSON.stringify(responseJson, null, 4));
    pdmResponse['body'] = responseJson;
    //return the created resource
    return pdmResponse;
  }
}