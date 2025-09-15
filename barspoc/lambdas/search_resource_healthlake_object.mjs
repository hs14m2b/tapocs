import { URLSearchParams } from 'url';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
const { sign } = jwt;
const HTTPS = "https://";
import { getSecretValue, getParamValue, environmentNeedsAuth, nrlEnvironmentMapping, createSignedJwtForAuth, getOAuth2AccessToken } from './api_common_functions.mjs';

let https;
try {
  https = await import('node:https');
} catch (err) {
  console.log('https support is disabled!');
}
let newId = uuidv4(); //Y05868-70bce845-679e-42ea-a909-30ac78ec1956

var APIKEYNAME;
var APIKEYKEY;
var apikeykeyLastRetrieved = 0;
var accessToken="";

const HEALTHLAKEFQDN = "healthlake.eu-west-2.amazonaws.com";
const HEALTHLAKEPATH = "/datastore/8843f629b43390e9c1d633ffb88f04a5/r4/";

const searchResource = async (querystringValues, resourceType, org, APIENVIRONMENT, APIKEYSECRET, APIKNAMEPARAM) =>
  {
    let queryStrings = new URLSearchParams(querystringValues).toString();
    let url = HTTPS + HEALTHLAKEFQDN + HEALTHLAKEPATH + resourceType + "?" + queryStrings;
    let XRequestID = uuidv4();
    // request option
    let options = {
      method: 'GET',
      rejectUnauthorized: false,
      headers: {
        'Authorization': 'Bearer THISISTHEOKEN',
        'X-Request-ID': XRequestID
      }
    };

    console.log("request options are  " + JSON.stringify(options));
    console.log("url is " + url);

    let healthlakeResponse = {
      "status": 0,
      "headers": {},
      "body": {}
    };
    let fetchResponse = await fetch(url, options);
    if (!fetchResponse.ok) {
      //get the body of the response
      let responseText = await fetchResponse.text();
      console.log(responseText);
      healthlakeResponse['status'] = fetchResponse.status;
      healthlakeResponse['body'] = responseText;
      return healthlakeResponse;
      //throw new Error(`Response status: ${fetchResponse.status}`);
    }
    else {  
      console.log(fetchResponse.status);
      healthlakeResponse['status'] = fetchResponse.status;
      // Display the header key/value pairs
      for (const pair of fetchResponse.headers.entries()) {
        //console.log(`${pair[0]}: ${pair[1]}`);
        healthlakeResponse['headers'][pair[0]] = pair[1];
      }
      let responseJson = await fetchResponse.text();
      console.log(JSON.stringify(responseJson, null, 4));
      healthlakeResponse['body'] = responseJson;
      //return the created resource
      return healthlakeResponse;
    }
  }

function delay(time) {
  return new Promise(resolve => setTimeout(resolve, time));
}

const searchResourceWithRetry = async (maxDuration, querystringValues, resourceType, org, APIENVIRONMENT, APIKEYSECRET, APIKNAMEPARAM) =>
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
      console.log("not found anything in healthlake - waiting a bit and trying again");
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

const getResource = async (id, resourceType, APIENVIRONMENT, APIKEYSECRET, APIKNAMEPARAM) =>
  {
    let XRequestID = uuidv4();
    let url = HTTPS + HEALTHLAKEFQDN + HEALTHLAKEPATH + resourceType + "/" + id;
    // request option
    let options = {
      method: 'GET',
      rejectUnauthorized: false,
      headers: {
        'Authorization': 'Bearer THISISTHEOKEN',
        'X-Request-ID': XRequestID
      }
    };

    console.log("request options are  " + JSON.stringify(options));
    console.log("url is " + url);

    let healthlakeResponse = {
      "status": 0,
      "headers": {},
      "body": {}
    };
    let fetchResponse = await fetch(url, options);
    if (!fetchResponse.ok) {
      //get the body of the response
      let responseText = await fetchResponse.text();
      console.log(responseText);
      healthlakeResponse['status'] = fetchResponse.status;
      healthlakeResponse['body'] = responseText;
      return healthlakeResponse;
      //throw new Error(`Response status: ${fetchResponse.status}`);
    }
    else {  
      console.log(fetchResponse.status);
      healthlakeResponse['status'] = fetchResponse.status;
      // Display the header key/value pairs
      for (const pair of fetchResponse.headers.entries()) {
        //console.log(`${pair[0]}: ${pair[1]}`);
        healthlakeResponse['headers'][pair[0]] = pair[1];
      }
      let responseJson = await fetchResponse.text();
      console.log(JSON.stringify(responseJson, null, 4));
      healthlakeResponse['body'] = responseJson;
      //return the created resource
      return healthlakeResponse;
    }
}

export class search_resource_healthlake{
  constructor(){
    this.searchResource = searchResource;
    this.searchResourceWithRetry = searchResourceWithRetry;
    this.getResource = getResource;
  }
}
