import  slot  from "../slot-001.json" assert { type: "json" };


import { v4 as uuidv4 } from 'uuid';
const HTTPS = "https://";

async function postSlot (newSlot)
  {
    console.log("newSlot is " + JSON.stringify(newSlot));
    let url = HTTPS + "healthlake.eu-west-2.amazonaws.com/datastore/8843f629b43390e9c1d633ffb88f04a5/r4/Slot";
    let options = {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer DUMMYTOKEN',
      'accept': 'application/fhir+json;version=1',
      'X-Request-ID': uuidv4(),
      'X-Correlation-ID': uuidv4(),
      'content-type': 'application/fhir+json;version=1.1.0'
    },
    body: JSON.stringify(newSlot)
  }
  console.log("request options are  " + JSON.stringify(options));
  console.log("url is " + url);
  let fetchResponse = await fetch(url, options);
  if (!fetchResponse.ok) {
    throw new Error(`Response status: ${fetchResponse.status}`);
  }
  else {  
    console.log(fetchResponse.status);
    return fetchResponse.status
  }
}

let newSlot = JSON.parse(JSON.stringify(slot));
//set start date to be a random date up to 100 days in the future between 9an and 5pm
let startDate = new Date();
startDate.setDate(startDate.getDate() + Math.floor(Math.random() * 100));
startDate.setHours(9 + Math.floor(Math.random() * 8));
startDate.setMinutes(0+ Math.floor(Math.random() * 59));
startDate.setSeconds(0);
startDate.setMilliseconds(0);
newSlot.start = startDate.toISOString();
//set end date to be 30 minutes after start date
let endDate = new Date(startDate);
endDate.setMinutes(endDate.getMinutes() + 30);
newSlot.end = endDate.toISOString();
//set status to free
newSlot.status = "free";
let result = await postSlot(newSlot);
console.log(result);
