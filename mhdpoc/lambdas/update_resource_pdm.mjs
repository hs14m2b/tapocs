import { URLSearchParams } from 'url';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
const { sign } = jwt;
const HTTPS = "https://";
import { getSecretValue, getParamValue, environmentNeedsAuth, nrlEnvironmentMapping, createSignedJwtForAuth, getOAuth2AccessToken , getParameterCaseInsensitive} from './api_common_functions.mjs';

var APIKEYNAME;
var APIKEYKEY;
var apikeykeyLastRetrieved = 0;
var ACCESSTOKEN;
var ACCESSTOKENLASTRETRIEVED = 0;


export const updateResource = async (resourceJson, resourceType, headersJson, APIENVIRONMENT, APIKEYSECRET, APIKNAMEPARAM) =>
  {
    let id = resourceJson.id;
    let url = HTTPS + APIENVIRONMENT + ".api.service.nhs.uk" + "/patient-data-manager/FHIR/R4/" + resourceType + "/" + id;
    let XRequestID = getParameterCaseInsensitive(headersJson, "X-Request-ID");
    //get the meta versionId of the resource
    let versionId = resourceJson.meta.versionId;
    //format http header value of If-Match to be "W/\"" + versionId + "\""
    let ifMatch = "W/\"" + versionId + "\"";
    //let Authorization = getParameterCaseInsensitive(headersJson, "Authorization");

    // request option
    let options = {
      method: 'PUT',
      rejectUnauthorized: false,
      headers: {
        'X-Request-ID': XRequestID,
        'x-correlation-id': XRequestID,
        'If-Match': ifMatch,
        'content-type': 'application/fhir+json'
      },
      body: JSON.stringify(resourceJson)
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

    let fetchResponse = await fetch(url, options);
    if (!fetchResponse.ok) {
      //get the body of the response
      let responseText = await fetchResponse.text();
      console.log(responseText);
      throw new Error(`Response status: ${fetchResponse.status}`);
    }
    else {  
      console.log(fetchResponse.status);
      let responseJson = await fetchResponse.json();
      console.log(JSON.stringify(responseJson, null, 4));
      //return the created resource
      return responseJson;
    }

  }

function delay(time) {
  return new Promise(resolve => setTimeout(resolve, time));
}

export const updateResourceWithRetry = async (maxDuration, resourceJson, resourceType, headersJson, APIENVIRONMENT, APIKEYSECRET, APIKNAMEPARAM) =>
{
  let startTime=Date.now();
  let pauseTime=1000;
  let currentTime=Date.now();
  let elapsedTime=currentTime-startTime;
  elapsedTime += pauseTime;
  let updateResult = false;
  while (true){
    try {
      updateResult = await updateResource(resourceJson, resourceType, headersJson, APIENVIRONMENT, APIKEYSECRET, APIKNAMEPARAM);
      break;
    } catch (error) {
      console.log("caught error updating resource in pdm - waiting a bit and trying again");
      currentTime=Date.now();
      if (maxDuration < (currentTime-startTime+pauseTime))
      {
        console.log("max duration would be exceeded in a pause - breaking loop");
        break;
      }
      await delay(pauseTime);
      console.log("doubling pause time for next loop");
      pauseTime = pauseTime*2;
      updateResult = await updateResource(querystringValues, resourceType, org, APIENVIRONMENT, APIKEYSECRET, APIKNAMEPARAM);
    }
  }
  return updateResult;
}
