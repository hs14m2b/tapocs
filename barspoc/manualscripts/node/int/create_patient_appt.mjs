import  appointment  from "../appointment-001.json" assert { type: "json" };

import { v4 as uuidv4 } from 'uuid';
const HTTPS = "https://";

async function postAppointment (newAppointment)
  {
    console.log("newAppointment is " + JSON.stringify(newAppointment));
    let url = HTTPS + "healthlake.eu-west-2.amazonaws.com/datastore/8843f629b43390e9c1d633ffb88f04a5/r4/Appointment";
    let options = {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer DUMMYTOKEN',
      'accept': 'application/fhir+json;version=1',
      'X-Request-ID': uuidv4(),
      'X-Correlation-ID': uuidv4(),
      'content-type': 'application/fhir+json;version=1.1.0'
    },
    body: JSON.stringify(newAppointment)
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

let newAppointment = JSON.parse(JSON.stringify(appointment));
let result = await postAppointment(newAppointment);
console.log(JSON.stringify(result));
 
