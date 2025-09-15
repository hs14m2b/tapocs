import { URLSearchParams } from 'url';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
const { sign } = jwt;
const HTTPS = "https://";
import { getSecretValue, getParamValue, environmentNeedsAuth, nrlEnvironmentMapping, createSignedJwtForAuth, getOAuth2AccessToken , getParameterCaseInsensitive} from './api_common_functions.mjs';

var APIKEYNAME;
var APIKEYKEY;
var apikeykeyLastRetrieved = 0;
var accessToken="";

const HEALTHLAKEFQDN = "healthlake.eu-west-2.amazonaws.com";
const HEALTHLAKEPATH = "/datastore/8843f629b43390e9c1d633ffb88f04a5/r4/";

export const updateResource = async (resourceJson, resourceType, headersJson, APIENVIRONMENT, APIKEYSECRET, APIKNAMEPARAM) =>
  {
    let id = resourceJson.id;
    let url = HTTPS + HEALTHLAKEFQDN + HEALTHLAKEPATH + resourceType + "/" + id;
    let XRequestID = getParameterCaseInsensitive(headersJson, "X-Request-ID");
    let Authorization = getParameterCaseInsensitive(headersJson, "Authorization");

    // request option
    let options = {
      method: 'PUT',
      rejectUnauthorized: false,
      headers: {
        'Authorization': Authorization,
        'X-Request-ID': XRequestID,
        'content-type': 'application/fhir+json'
      },
      body: JSON.stringify(resourceJson)
    };

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
      // Display the header key/value pairs
      for (const pair of fetchResponse.headers.entries()) {
        console.log(`${pair[0]}: ${pair[1]}`);
      }
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
      console.log("caught error updating resource in healthlake - waiting a bit and trying again");
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
