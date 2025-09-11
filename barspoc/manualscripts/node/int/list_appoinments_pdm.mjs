import { createSignedJwtForAuth, getOAuth2AccessToken } from '../../../lambdas/api_common_functions.mjs';
import { NHSNumber, OAuthAPIKey, OAuthAPIKeyName, APIDomain } from "./config.mjs";
import { deleteResource, getResource } from './delete_resource_pdm.mjs';

import { v4 as uuidv4 } from 'uuid';
const HTTPS = "https://";
const apiClientPrivateKey = readFileSync('../../../certs/mhdtest001.key', 'utf8');
import { readFileSync } from 'node:fs';
let servicerequestid = "14873ff3-1353-315b-b531-0a67ca7a6894";

async function listAppointments (accessToken)
{
  let patientIdentifier = new URLSearchParams({
        "patient:identifier" : "https://fhir.nhs.uk/Id/nhs-number|" + NHSNumber}).toString();

  //let url = HTTPS + APIDomain + "/patient-data-manager/FHIR/R4/Appointment?status=proposed,pending,booked,arrived,fulfilled,cancelled,noshow,entered-in-error,checked-in,waitlist";
  let url = HTTPS + APIDomain + "/patient-data-manager/FHIR/R4/Appointment?" + patientIdentifier;
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
    let responseJson = await fetchResponse.json();
    if (responseJson.link && responseJson.link.length > 0) {
      console.log("response has forward link " + responseJson.link.length);
      let nextLink = responseJson.link.find(link => link.relation === "next");
      while (nextLink) {
        console.log("getting next page of results");
        console.log("next link is " + nextLink.url);
        let nextPage = await getNextPage(accessToken, nextLink.url);
        responseJson.entry = responseJson.entry.concat(nextPage.entry);
        if (nextPage.link && nextPage.link.length > 0) {
          nextLink = nextPage.link.find(link => link.relation === "next");
        } else {
          nextLink = null;
        }
      }
    }
    //console.log(JSON.stringify(responseJson, null, 4));
    return responseJson;
  }
}

async function getNextPage (accessToken, nextLink)
{
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
  let fetchResponse = await fetch(nextLink, options);
  if (!fetchResponse.ok) {
    console.log(fetchResponse.status);
    console.log(fetchResponse.statusText);
    console.log(await fetchResponse.text());
    throw new Error(`Response status: ${fetchResponse.status}`);
  }
  else {  
    console.log(fetchResponse.status);
    let responseJson = await fetchResponse.json();
    //console.log(JSON.stringify(responseJson, null, 4));
    return responseJson;
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

let result = await listAppointments(accessToken);
//for each entry in result
for (let entry of result.entry) {
  //does task "for" have an identifier value?
  if (entry.resource.participant && entry.resource.participant.length>0 && entry.resource.participant.find(participant => participant.actor.type && participant.actor.type == "Patient")) {
    let nhsNumber = entry.resource.participant.find(participant => participant.actor.type && participant.actor.type == "Patient").actor.identifier.value;
    if (nhsNumber =="9661034524") {
      console.log("found appointment for nhs number " + nhsNumber);
      //console.log(JSON.stringify(entry.resource, null, 2));
      //console.log(JSON.stringify(await getResource(accessToken, "Appointment", entry.resource.id), null, 2));
      //if so, log the nhs number, appointment id and status
      console.log("nhs number is " + nhsNumber);
      console.log("appointment id is " + entry.resource.resourceType + "|" + entry.resource.id);
      console.log("status is " + entry.resource.status);
      let serviceRequest;
      try {
        serviceRequest = entry.resource.basedOn.find(ref => ref.type == "ServiceRequest");
        if (serviceRequest) {
          console.log("service request is " + serviceRequest.reference);
        } else {
          console.log("no service request found");
        }
      } catch (error) {
        console.log("error occurred while checking for service request");
        console.log(error);
      }
      if (!serviceRequest) {
        console.log("no service request found - deleting appointment");
        //console.log(JSON.stringify(entry.resource, null, 2));
        //await deleteResource(accessToken, "Appointment", entry.resource.id);
      }
    }
    //console.log("deleting task and service request");
    //await deleteResource(accessToken, "Task", entry.resource.id);
    //await deleteResource(accessToken, "ServiceRequest", entry.resource.focus.reference.split('/').pop());
  }
  else {
    console.log("no nhs number found - deleting appointment");
    //console.log(JSON.stringify(entry.resource, null, 2));
    //await deleteResource(accessToken, "Appointment", entry.resource.id);
  }
}

