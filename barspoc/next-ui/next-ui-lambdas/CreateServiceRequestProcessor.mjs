// Filename: CreateServiceRequestProcessor.mjs
import servicerequest from './serviceRequest001.json' with { type: 'json' };
import servicerequestbundle from './serviceRequestBundle.json' with { type: 'json' };
import messageheader from './messageHeader.json' with { type: 'json' };
import { v4 as uuidv4 } from 'uuid';

export const handler = async (event, postServiceRequestBarsObject, getParameterCaseInsensitive, APIENVIRONMENT, APIKEYSECRET, APIKNAMEPARAM, processMessage) => {
  console.log(JSON.stringify(event));
  //POST handler with a JSON body
  try {
    //get the nhsnumber from the event.body which is x-www-form-urlencoded
    if (event.isBase64Encoded) {
      event.body = Buffer.from(event.body, 'base64').toString('utf8');
    }

    let resourceJson = Object.fromEntries(new URLSearchParams(event.body));
    //expect the resourceJson to have a property nhsnumber
    let nhsnumber = resourceJson.nhsnumber;
    // barsserviceid and barsidentifer are both hardcoded for the timebeing
    let barsidentifier = "9f00342d-70de-38d5-9176-af97f1ba1b3d"; //this is the identifier of the HealthcareService
    let barsserviceid = "matthewbrown"; // this is the logical identifier of the target system
    let odscode = "X26"; //hardcoded for the moment
    let subject = {
      "identifier": {
          "system": "https://fhir.nhs.uk/Id/nhs-number",
          "value": nhsnumber
      }
    };
    servicerequest.subject = subject;
    let performer = {
          "reference": "HealthcareService/" + barsidentifier,
          "type": "HealthcareService",
          "display": "Vaccination Clinic - RSV, Influenza and COVID-19",
          "identifier": {
                  "system": "https://fhir.nhs.uk/Id/dos-service-id",
                  "value": barsserviceid
          }
    };
    servicerequest.performer = [performer];
    let servicerequestfullurl = "urn:uuid:" + uuidv4();
    let messageheaderfullurl = "urn:uuid:" + uuidv4();
    messageheader.focus = [
      {
        "reference": servicerequestfullurl
      }
    ];
    servicerequestbundle.entry[0].resource = messageheader;
    servicerequestbundle.entry[0].fullUrl = messageheaderfullurl;
    servicerequestbundle.entry[1].resource = servicerequest;
    servicerequestbundle.entry[1].fullUrl = servicerequestfullurl;
    let barsResponse = await postServiceRequestBarsObject.postServiceRequest(servicerequestbundle, barsserviceid, odscode, APIENVIRONMENT, APIKEYSECRET, APIKNAMEPARAM);
    console.log("bars response to process-message is " + JSON.stringify(barsResponse));
    //return the resource
    let barsLambdaResponse = {
      statusCode: 200,
      "headers": {
          "Content-Type": "application/fhir+json",
          "X-Response-Source": "BaRS"
      },
      body: JSON.stringify(barsResponse)
    };
    console.log(JSON.stringify(barsLambdaResponse));
    return barsLambdaResponse;
  }
  catch (error) {
    console.log("create service request BaRS failed");
    console.log(error.message);
    let response = {
      statusCode: 500,
      "headers": {
          "Content-Type": "application/json"
      },
      body: JSON.stringify({ "result": "create service request BaRS failed", "message": error.message })
    }
    return response;
  }
}
