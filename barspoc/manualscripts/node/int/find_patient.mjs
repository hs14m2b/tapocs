import  patient  from "../patient.json" assert { type: "json" };
import { NHSNumber } from "./config.mjs";

import { v4 as uuidv4 } from 'uuid';
const HTTPS = "https://";

async function findPatient ()
  {
    let patientIdentifier = new URLSearchParams({
      "identifier" : "https://fhir.nhs.uk/Id/nhs-number|" + NHSNumber}).toString();
    patientIdentifier = new URLSearchParams({
        "identifier" : NHSNumber}).toString();
    let url = HTTPS + "healthlake.eu-west-2.amazonaws.com/datastore/8843f629b43390e9c1d633ffb88f04a5/r4/Patient?" + patientIdentifier;
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

let result = await findPatient();
console.log(JSON.stringify(result));
