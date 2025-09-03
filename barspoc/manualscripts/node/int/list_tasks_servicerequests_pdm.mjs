import { createSignedJwtForAuth, getOAuth2AccessToken } from '../../../lambdas/api_common_functions.mjs';
import { NHSNumber, OAuthAPIKey, OAuthAPIKeyName, APIDomain } from "./config.mjs";
import { deleteResource } from './delete_resource_pdm.mjs';

import { v4 as uuidv4 } from 'uuid';
const HTTPS = "https://";
const apiClientPrivateKey = readFileSync('../../../certs/mhdtest001.key', 'utf8');
import { readFileSync } from 'node:fs';
let servicerequestid = "14873ff3-1353-315b-b531-0a67ca7a6894";

async function listTasks (accessToken)
{
  let url = HTTPS + APIDomain + "/patient-data-manager/FHIR/R4/Task?code=fulfill";
  let options = {
    method: 'GET',
    headers: {
      'Authorization': 'Bearer ' + accessToken,
      'accept': 'application/fhir+json;version=1',
      'X-Request-ID': uuidv4(),
      'X-Correlation-ID': uuidv4(),
    }
  }
  console.log("request options are  " + JSON.stringify(options));
  console.log("url is " + url);
  let fetchResponse = await fetch(url, options);
  if (!fetchResponse.ok) {
    console.log(fetchResponse.status);
    console.log(fetchResponse.statusText);
    console.log(await fetchResponse.text());
    throw new Error(`Response status: ${fetchResponse.status}`);
  }
  else {  
    console.log(fetchResponse.status);
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
let accessToken = await getAccessToken();

let result = await listTasks(accessToken);
//for each entry in result
for (let entry of result.entry) {
  console.log("task id is " + entry.resource.resourceType + "|" + entry.resource.id);
  console.log("service request id is " + entry.resource.focus.reference);
  //does task "for" have an identifier value?
  if (entry.resource.for && entry.resource.for.identifier && entry.resource.for.identifier.value) {
    console.log("nhs number is " + entry.resource.for.identifier.value);
    //console.log("deleting task and service request");
    //await deleteResource(accessToken, "Task", entry.resource.id);
    //await deleteResource(accessToken, "ServiceRequest", entry.resource.focus.reference.split('/').pop());
  }
  else {
    console.log("no nhs number found - deleting task and service request");
    await deleteResource(accessToken, "Task", entry.resource.id);
    await deleteResource(accessToken, "ServiceRequest", entry.resource.focus.reference.split('/').pop());
  }
}

