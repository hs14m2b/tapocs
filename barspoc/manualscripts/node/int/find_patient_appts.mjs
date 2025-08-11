import  patient  from "../patient.json" assert { type: "json" };
import { NHSNumber } from "./config.mjs";

import { v4 as uuidv4 } from 'uuid';
const HTTPS = "https://";

async function findAppts ()
  {
    //981d8bc9-cf32-4a05-9e48-8d7f49074e9e
    let patientIdentifier = new URLSearchParams({
      "actor:Patient" : "981d8bc9-cf32-4a05-9e48-8d7f49074e9e"}).toString();
    patientIdentifier = new URLSearchParams({
        "actor:Patient.identifier" : NHSNumber}).toString();
    //patientIdentifier = new URLSearchParams({
    //  "patient" : "Patient/981d8bc9-cf32-4a05-9e48-8d7f49074e9e"}).toString();
    let url = HTTPS + "healthlake.eu-west-2.amazonaws.com/datastore/8843f629b43390e9c1d633ffb88f04a5/r4/Appointment?" + patientIdentifier;
    let options = {
    method: 'GET',
    headers: {
      'Authorization': 'Bearer DUMMYTOKEN',
      'accept': 'application/fhir+json;version=1',
      'X-Request-ID': uuidv4(),
      'X-Correlation-ID': uuidv4(),
      'content-type': 'application/fhir+json;version=1.1.0'
    }
  }
  console.log("request options are  " + JSON.stringify(options));
  console.log("url is " + url);
  let fetchResponse = await fetch(url, options);
  if (!fetchResponse.ok) {
    throw new Error(`Response status: ${fetchResponse.status}`);
  }
  else {  
    console.log(fetchResponse.status);
    return await fetchResponse.json();
  }
}

let result = await findAppts();
console.log(JSON.stringify(result));
 
