// Filename: AppointmentCreateProcessor.mjs
import documentReference from './docref-bars.json' with { type: "json" };
import task from './task.json' with { type: "json" };

async function createResourceFhirServer(resourceJson, event, fhirCreateHelper, APIKEYSECRET, APIENVIRONMENT, APIKNAMEPARAM){
    let maxDuration=25000;
    try {
      let headersJson = event.headers;
      console.log("posting to pdm")
      let healthlakeresponse = await fhirCreateHelper.createResource(resourceJson, resourceJson.resourceType, headersJson, APIENVIRONMENT, APIKEYSECRET, APIKNAMEPARAM);
      console.log("pdm response is " + JSON.stringify(healthlakeresponse));
      return healthlakeresponse;
    } catch (error) {
      console.log(error);
      return false;
    }
  }

async function updateResourceFhirServer(resourceJson, event, fhirUpdateHelper, APIKEYSECRET, APIENVIRONMENT, APIKNAMEPARAM){
    let maxDuration=25000;
    try {
      //get the posted resource
      let headersJson = event.headers;
      console.log("putting to pdm")
      let healthlakeresponse = await fhirUpdateHelper.updateResource(resourceJson, resourceJson.resourceType, headersJson, APIENVIRONMENT, APIKEYSECRET, APIKNAMEPARAM);
      console.log("pdm response is " + JSON.stringify(healthlakeresponse));
      return healthlakeresponse;
    } catch (error) {
      console.log(error);
      return false;
    }
  }
  
async function createDocumentRefBars(appointment, event, postDocumentRefBarsObject, APIENVIRONMENT, APIKEYSECRET, APIKNAMEPARAM) {
  let newDocRef = documentReference;
  let { id, description, start, end, participant } = appointment;
  let patientParticipant = getPatientParticipant(participant);
  console.log("patientParticipant is " + JSON.stringify(patientParticipant));
  let identifiers = [
    {
      "system": "https://fhir.nhs.uk/Id/BaRS-Identifier",
      "value": id
    },
    {
      "system": "https://fhir.nhs.uk/Id/dos-service-id",
      "value": "matthewbrown"
    },
    {
      "system": "https://fhir.nhs.uk/id/product-id",
      "value": "6a5fc9f4-4af4-4819-b5d1-1339d9b64295"
    }
  ]
  newDocRef.identifier = identifiers;
  newDocRef.context.period.start = start;
  newDocRef.context.period.end = end;
  newDocRef.subject.identifier = patientParticipant.actor.identifier;
  newDocRef.date = new Date().toISOString();
  newDocRef.content[0].attachment.url = "https://bars-int-x26.tsassolarch.thirdparty.nhs.uk/barspoc/FHIR/R4/Appointment/" + id;
  //need to work out how to set the context.practiceSetting
  console.log(JSON.stringify(newDocRef, null, 4));
  //returns a json object with "body" and "headers" - the headers contain the "location" of the new resource
  let barsResponse = await postDocumentRefBarsObject.sendDocRef(newDocRef, APIENVIRONMENT, APIKEYSECRET, APIKNAMEPARAM);
  console.log("1bars response is " + JSON.stringify(barsResponse));
  return barsResponse;
}

function getPatientParticipant(participants){
  return participants.find(k => k.actor.type.toLowerCase() === "patient");
}

export const handler = async (event, fhirServerCreateHelperObject, fhirServerUpdateHelperObject, snsCommonFunctionObjectInstance, getParameterCaseInsensitive, APIENVIRONMENT, APIKEYSECRET, APIKNAMEPARAM, NRLENABLED, PDMRESOURCETOPICARN) => {
  console.log(JSON.stringify(event));
  //POST handler for a new ServiceRequest
    try {
      //try pdm
      try {
        //get the ServiceRequest resource
        if (event.isBase64Encoded) {
          event.body = Buffer.from(event.body, 'base64').toString('utf8');
          event.isBase64Encoded = false;
        }
        let resourceJson = JSON.parse(event.body);
        console.log("resourceJson is " + JSON.stringify(resourceJson));
        //find the ServiceRequest resource
        let serviceRequestResource = resourceJson.entry.find(k => k.resource && k.resource.resourceType === "ServiceRequest");
        if (!serviceRequestResource) {
          throw new Error("No ServiceRequest resource found in the request");
        }
        let resourceResponse = await createResourceFhirServer(serviceRequestResource.resource, event, fhirServerCreateHelperObject, APIKEYSECRET, APIENVIRONMENT, APIKNAMEPARAM);
        if (resourceResponse){
          //get the id of the resource
          let servicerequestid = resourceResponse.id;
          console.log("servicerequestid is " + servicerequestid);
          //create a Task within PDM to give Patient and Clinicians visibility of the ServiceRequest
          let newTask = JSON.parse(JSON.stringify(task));
          console.log(JSON.stringify(resourceResponse, null, 4));
          newTask.focus.reference = "ServiceRequest/" + servicerequestid;
          newTask.basedOn = [
            {
              "reference": "ServiceRequest/" + servicerequestid
            }
          ];
          newTask['for']['identifier'] = resourceResponse.subject.identifier;
          newTask['for']['type'] = "Patient";
          newTask['executionPeriod'] = resourceResponse['occurrencePeriod'];
          newTask['status'] = "ready";
          //set the identifier to reference the BaRS/DoS Service Id
          newTask['identifier'].push(
            {
              "system": "https://fhir.nhs.uk/Id/dos-service-id",
              "value": "matthewbrown"
            }
          );
          console.log("newTask is " + JSON.stringify(newTask, null, 4));
          let taskResponse;
          try {
            //taskResponse = await createResourceFhirServer(newTask, event, fhirServerCreateHelperObject, APIKEYSECRET, APIENVIRONMENT, APIKNAMEPARAM);
          } catch (error) {
            console.log("creating Task in PDM failed - creating SNS event to trigger reprocess");
            console.log(error);
          }
          if (!taskResponse) {
            console.log("creating Task in PDM failed - creating SNS event to trigger reprocess");
            try {
              await snsCommonFunctionObjectInstance.publishEvent(JSON.stringify({
                resource: newTask,
                resourceType: "Task",
                action: "Create"
              }), PDMRESOURCETOPICARN);
              console.log("published event to SNS");
            } catch (error) {
              console.log("publishing event to SNS failed");
              console.log(error);
            }
          }
          //return the resource
          let healthlakeResponse = {
            statusCode: 201,
            "headers": {
                "Content-Type": "application/fhir+json",
                "X-Response-Source": "PDM",
                "Location": "ServiceRequest/" + servicerequestid
            },
            body: JSON.stringify(resourceResponse)
          };
          console.log(JSON.stringify(healthlakeResponse));
          return healthlakeResponse;
        }
        else {
          console.log("createFhirServer failed");
          let response = {
            statusCode: 500,
            "headers": {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ "result": "createFhirServer failed" })
          }
          return response;
        }
      } catch (error) {
        console.log("caught an unexpected error processing data from healthlake");
        throw error;
      }
    } catch (error) {
        console.log("caught error " + error.message);
        let response = {
            statusCode: 500,
            "headers": {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ "result": error.message })
        }
        return response;
    }
}
