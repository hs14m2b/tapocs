import { createSignedJwtForAuth, getOAuth2AccessToken } from '../../../lambdas/api_common_functions.mjs';
import { NHSNumber, OAuthAPIKey, OAuthAPIKeyName, APIDomain } from "./config.mjs";

import { v4 as uuidv4 } from 'uuid';
const HTTPS = "https://";
const apiClientPrivateKey = readFileSync('../../../certs/mhdtest001.key', 'utf8');
import { readFileSync } from 'node:fs';

//let id = "9c7ef8a3-0df2-30ed-9c94-4d424e3ecc03"; // replace with the actual ID
let resourceType = "Task";
async function deleteResource (accessToken, resourceType, resourceId)
  {
    let result = await getResource(accessToken, resourceType, resourceId);
    //get the meta versionId from the resource
    let versionId = result.meta.versionId;
    console.log("versionId is " + versionId);
    //format http header value of If-Match to be "W/\"1\""
    let ifMatch = "W/\"" + versionId + "\"";
    console.log("ifMatch is " + ifMatch);
    let url = HTTPS + APIDomain + "/patient-data-manager/FHIR/R4/" + resourceType + "/" + resourceId;
    let options = {
    method: 'DELETE',
    headers: {
      'Authorization': 'Bearer ' + accessToken,
      'accept': 'application/fhir+json;version=1',
      'X-Request-ID': uuidv4(),
      'X-Correlation-ID': uuidv4(),
      'If-Match': ifMatch,
      'content-type': 'application/fhir+json'
    }
  }
  console.log("request options are  " + JSON.stringify(options));
  console.log("url is " + url);
  let fetchResponse = await fetch(url, options);
  if (!fetchResponse.ok) {
    console.log(fetchResponse.status);
    console.log(await fetchResponse.text());
    throw new Error(`Response status: ${fetchResponse.status}`);
  }
  else {  
    console.log(fetchResponse.status);
    return fetchResponse.status;
  }
}

async function getResource (accessToken, resourceType, resourceId)
  {
    let url = HTTPS + APIDomain + "/patient-data-manager/FHIR/R4/" + resourceType + "/" + resourceId;
    let options = {
    method: 'GET',
    headers: {
      'Authorization': 'Bearer ' + accessToken,
      'accept': 'application/fhir+json;version=1',
      'X-Request-ID': uuidv4(),
      'X-Correlation-ID': uuidv4(),
      'content-type': 'application/fhir+json'
    }
  }
  console.log("request options are  " + JSON.stringify(options));
  console.log("url is " + url);
  let fetchResponse = await fetch(url, options);
  if (!fetchResponse.ok) {
    console.log(fetchResponse.status);
    console.log(await fetchResponse.text());
    throw new Error(`Response status: ${fetchResponse.status}`);
  }
  else {  
    console.log(fetchResponse.status);
    // Display the headers as key/value pairs
    for (const pair of fetchResponse.headers.entries()) {
      console.log(`${pair[0]}: ${pair[1]}`);
    }
    return await fetchResponse.json();
  }
}

async function getAccessToken(){
  let blah = await createSignedJwtForAuth(OAuthAPIKey,
  OAuthAPIKeyName, apiClientPrivateKey,
  APIDomain, "/oauth2/token");
  let blah2 = await getOAuth2AccessToken(blah, APIDomain, "/oauth2/token");
  console.log(blah2);
  //load into JSON object
  let blah3 = JSON.parse(blah2);
  return blah3.access_token;
}
//let accessToken = await getAccessToken();

//let result = await getResource(accessToken);
//delete the resource
//result = await deleteResource(accessToken, resourceType, id);
//console.log(JSON.stringify(result));

export { deleteResource };
