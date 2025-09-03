// Filename: AppointmentCreateProcessor.mjs
import documentReference from './docref-bars.json' assert { type: "json" };

async function createResourceFhirServer(event, fhirCreateHelper, APIKEYSECRET, APIENVIRONMENT, APIKNAMEPARAM){
    let maxDuration=25000;
    try {
      //get the posted resource
      if (event.isBase64Encoded) {
        event.body = Buffer.from(event.body, 'base64').toString('utf8');
      }
      let resourceJson = JSON.parse(event.body);
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

async function createAppointmentFhirServer(appointmentJson, event, fhirCreateHelper, APIKEYSECRET, APIENVIRONMENT, APIKNAMEPARAM){
    let maxDuration=25000;
    try {
      let resourceJson = appointmentJson;
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
  
async function createDocumentRefBars(appointment, serviceRequestBody, event, postDocumentRefBarsObject, APIENVIRONMENT, APIKEYSECRET, APIKNAMEPARAM) {
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
  //add description from service request code text.
  newDocRef.description = "Appointment for " + serviceRequestBody.code.text;
  console.log(JSON.stringify(newDocRef, null, 4));
  //returns a json object with "body" and "headers" - the headers contain the "location" of the new resource
  let barsResponse = await postDocumentRefBarsObject.sendDocRef(newDocRef, APIENVIRONMENT, APIKEYSECRET, APIKNAMEPARAM);
  console.log("bars response is " + JSON.stringify(barsResponse));
  return barsResponse;
}

function getPatientParticipant(participants){
  return participants.find(k => k.actor.type.toLowerCase() === "patient");
}

async function getSlot(appointment, event, searchResourcePDMObject, APIKEYSECRET, APIENVIRONMENT, APIKNAMEPARAM) {
  let slotId = appointment.slot[0].reference.split("/").pop();
  let slotGetResult = await searchResourcePDMObject.getResource(slotId, "Slot", APIENVIRONMENT, APIKEYSECRET, APIKNAMEPARAM);
  if (slotGetResult.status !== 200) {
    throw new Error("Failed to retrieve Slot");
  }
  let slotResource = JSON.parse(slotGetResult.body);
  console.log("slot is " + JSON.stringify(slotResource));
  return slotResource;
}

async function getHealthcareService(slot, event, searchResourcePDMObject, APIKEYSECRET, APIENVIRONMENT, APIKNAMEPARAM) {
  let scheduleId = slot.schedule.reference.split("/").pop();
  let scheduleGetResult = await searchResourcePDMObject.getResource(scheduleId, "Schedule", APIENVIRONMENT, APIKEYSECRET, APIKNAMEPARAM);
  if (scheduleGetResult.status !== 200) {
    throw new Error("Failed to retrieve Schedule");
  }
  let scheduleResource = JSON.parse(scheduleGetResult.body);
  let healthcareServiceId = scheduleResource.actor.find(a => a.type === "HealthcareService").reference.split("/").pop();
  let healthcareServiceGetResult = await searchResourcePDMObject.getResource(healthcareServiceId, "HealthcareService", APIENVIRONMENT, APIKEYSECRET, APIKNAMEPARAM);
  if (healthcareServiceGetResult.status !== 200) {
    throw new Error("Failed to retrieve HealthcareService");
  }
  let healthcareServiceResource = JSON.parse(healthcareServiceGetResult.body);
  console.log("healthcare service is " + JSON.stringify(healthcareServiceResource));
  return healthcareServiceResource;
}

export const handler = async (event, fhirCreateHelper, fhirUpdateHelper, postDocumentRefBarsObject, postDocumentRefPDMObject, searchResourcePDMObject, getParameterCaseInsensitive, APIENVIRONMENT, APIKEYSECRET, APIKNAMEPARAM, NRLENABLED) => {
  console.log(JSON.stringify(event));
  //POST handler for a new appointment
    try {
      //check permissions - validate the patient has an outstanding ServiceRequest.
      // the ServiceRequest must have a status of "draft"
      // the ServiceRequest must be for the same patient as the appointment
      // the ServiceRequest must be for the same HealthcareService as the appointment
      if (event.isBase64Encoded) {
        event.body = Buffer.from(event.body, 'base64').toString('utf-8');
      }
      event.isBase64Encoded = false;
      let appointmentJson = JSON.parse(event.body);
      let nhsnumber = getPatientParticipant(appointmentJson.participant).actor.identifier.value;
      console.log("NHS Number is " + nhsnumber);
      //check if the patient has an outstanding ServiceRequest
      let queryParams = {
        "subject:identifier" : "https://fhir.nhs.uk/Id/nhs-number|" + nhsnumber,
        "status" : "draft"
      };
      let serviceRequestPDMResponse = await searchResourcePDMObject.searchResource(queryParams, "ServiceRequest", "X26", APIENVIRONMENT, APIKEYSECRET, APIKNAMEPARAM);
      console.log("serviceRequestPDMResponse is " + JSON.stringify(serviceRequestPDMResponse));
      //check the response status == 200
      if (serviceRequestPDMResponse.status !== 200) {
        throw new Error("Failed to retrieve ServiceRequest");
      }
      //load the response body into JSON
      let queryResponse = JSON.parse(serviceRequestPDMResponse.body);
      //check that response contains entry array and it is not empty
      if (!Array.isArray(queryResponse.entry) || queryResponse.entry.length === 0) {
        throw new Error("ServiceRequest not found");
      }
      let slot = {};
      let slotRetrieved = false;
      let healthcareService = {};
      let healthcareServiceRetrieved = false;
      let healthcareServiceParticipant = appointmentJson.participant.find(p => p.actor.type === "HealthcareService");
      let healthcareServiceReference = healthcareServiceParticipant ? healthcareServiceParticipant.actor.reference : null;
      if (!healthcareServiceReference) {
        console.log("No HealthcareService reference found in appointment");
        console.log("Retrieving HealthcareService details via slot and schedule");
        slot = await getSlot(appointmentJson, event, searchResourcePDMObject, APIKEYSECRET, APIENVIRONMENT, APIKNAMEPARAM);
        slotRetrieved = true;
        if (slot.schedule && slot.schedule.reference) {
          healthcareService = await getHealthcareService(slot, event, searchResourcePDMObject, APIKEYSECRET, APIENVIRONMENT, APIKNAMEPARAM);
          healthcareServiceRetrieved = true;
          healthcareServiceReference = healthcareService.id ? "HealthcareService/" + healthcareService.id : "";
          //add HealthcareService as participant actor
          let dosidentifier = healthcareService.identifier ? healthcareService.identifier.find(i => i.system === "https://fhir.nhs.uk/Id/dos-service-id") : null;
          let actor = {
            "type": "HealthcareService",
            "reference": healthcareServiceReference,
            "display": healthcareService.name
          };
          if (dosidentifier) {
            actor.identifier = dosidentifier;
          }
          appointmentJson.participant.push({
            "actor": actor,
            "status": "accepted"
          });
        }
      }
      let serviceRequestBody = {};
      let validServiceRequest = true;
      //loop through each ServiceRequest entry
      for (let entry of queryResponse.entry) {
        if (entry.resource && entry.resource.resourceType === "ServiceRequest") {
          serviceRequestBody = entry.resource;
          //check that the subject identifier value matches the nhsnumber
          if (serviceRequestBody.subject.identifier.value !== nhsnumber) {
            console.log("ServiceRequest subject identifier does not match NHS number");
            validServiceRequest = false;
          }
          //check that the status is "draft"
          if (serviceRequestBody.status !== "draft") {
            console.log("ServiceRequest status is not draft");
            validServiceRequest = false;
          }
          //check that the performer with type HealthcareService is present and the reference matches the appointment participant of type HealthcareService reference
          let serviceRequestHealthcareService = serviceRequestBody.performer.find(p => p.type === "HealthcareService").reference;
          if (!serviceRequestHealthcareService) {
            console.log("No HealthcareService reference found in ServiceRequest");
            validServiceRequest = false;
          }
          if (healthcareServiceReference !== serviceRequestHealthcareService) {
            console.log("HealthcareService references do not match");
            validServiceRequest = false;
          }
          if (!validServiceRequest) {
            console.log("ServiceRequest validation failed for this entry");
          }
          if (validServiceRequest) {
            //add reference to service request into Appointment
            appointmentJson['basedOn'] = [{
              "type": "ServiceRequest",
              "reference": "ServiceRequest/" + serviceRequestBody.id
            }];
            //add reference to location into appointment participant if not present.
            let apptLocation = appointmentJson.participant.find(p => p.actor.type === "Location");
            if (!apptLocation) {
              console.log("No Location reference found in Appointment, adding location from HealthcareService");
              if (healthcareServiceRetrieved) {
                let hsLocation = healthcareService.location[0];
                if (!hsLocation.type) hsLocation['type'] = "Location";
                appointmentJson.participant.push({
                  "actor": hsLocation,
                  "status": "accepted"
                });
              }
            }
            console.log("ServiceRequest validation passed for this entry");
            break; // exit loop after finding the first ServiceRequest
          }
        }
      }
      if (!validServiceRequest) {
        throw new Error("ServiceRequest validation failed - no valid service requests found to support creating an appointment");
      }
      console.log("permissions checks passed - creating appointment");
      try {
        //try pdm
        let resourceResponse = await createAppointmentFhirServer(appointmentJson, event, fhirCreateHelper, APIKEYSECRET, APIENVIRONMENT, APIKNAMEPARAM);
        if (resourceResponse){
          //get the id of the resource
          let appointmentid = resourceResponse.id;
          if (NRLENABLED) {
            try {
                //create DocumentReference entry in BaRS/NRL
                //returns a json object with "body" and "headers" - header location contains the id of the new resource
                let barsResponse = await createDocumentRefBars(resourceResponse, serviceRequestBody, event, postDocumentRefBarsObject, APIENVIRONMENT, APIKEYSECRET, APIKNAMEPARAM);
                console.log("bars response is " + JSON.stringify(barsResponse));
                let location = getParameterCaseInsensitive(barsResponse.headers, "location");
                console.log("location is " + location);
                let id = location.split("/").pop();
                //update the appointment to hold a reference to the DocumentReference in BaRS
                let barsTag = {
                  "display": "DocumentReference|" + id
                }
                console.log("barsTag is " + JSON.stringify(barsTag));
                if (!resourceResponse.meta) resourceResponse['meta'] = {};
                console.log("HERE1");
                if (!resourceResponse.meta.tag) resourceResponse.meta['tag'] = [];
                resourceResponse.meta.tag.push(barsTag);
                console.log("HERE2");
              } catch (error) {
                console.log(error.message);
                console.log("failed to create the document reference via BaRS --- but continuing anyway and logging for manual resolution");
              }
          }
          try {
            //create DocumentReference entry in PDM
            //returns a json object with "body" and "headers" 
            let pdmDocRefResponse = await createDocumentRefBars(resourceResponse, serviceRequestBody, event, postDocumentRefPDMObject, APIENVIRONMENT, APIKEYSECRET, APIKNAMEPARAM);
            console.log("pdm response is " + JSON.stringify(pdmDocRefResponse));
            let id = pdmDocRefResponse.body.id;
            //update the appointment to hold a reference to the DocumentReference in PDM
            let barsTag = {
              "display": "PDMDocumentReference|" + id
            }
            console.log("PDMTag is " + JSON.stringify(barsTag));
            if (!resourceResponse.meta) resourceResponse['meta'] = {};
            if (!resourceResponse.meta.tag) resourceResponse.meta['tag'] = [];
            resourceResponse.meta.tag.push(barsTag);
          } catch (error) {
            console.log(error.message);
            console.log("failed to create the document reference via PDM --- but continuing anyway and logging for manual resolution");
          }
          try {
            let source = "https://bars-int-x26.tsassolarch.thirdparty.nhs.uk/barspoc/FHIR/R4/Appointment/" + appointmentid;
            resourceResponse['meta']['source'] = source;
            console.log("updated resource is " + JSON.stringify(resourceResponse));
            let updatedResource = await updateResourceFhirServer(resourceResponse, event, fhirUpdateHelper, APIKEYSECRET, APIENVIRONMENT, APIKNAMEPARAM);
            console.log("updated healthlake resource is " + JSON.stringify(updatedResource));
          } catch (error) {
            console.log(error.message);
            console.log("failed to update the appointment in PDM --- but continuing anyway and logging for manual resolution");
          }
          //update the ServiceRequest status to "completed"
          try {
            serviceRequestBody.status = "completed";
            console.log("updated service request is " + JSON.stringify(serviceRequestBody));
            let updatedResource = await updateResourceFhirServer(serviceRequestBody, event, fhirUpdateHelper, APIKEYSECRET, APIENVIRONMENT, APIKNAMEPARAM);
            console.log("updated pdm resource is " + JSON.stringify(updatedResource));
          } catch (error) {
            console.log(error.message);
            console.log("failed to update the service request in PDM --- but continuing anyway and logging for manual resolution");
          }
          // find and update the outstanding Task related to the ServiceRequest
          try {
            let taskQueryStrings ={
              "focus" : "ServiceRequest/" + serviceRequestBody.id
            };
            let taskPDMResponse = await searchResourcePDMObject.searchResource(taskQueryStrings, "Task", "X26", APIENVIRONMENT, APIKEYSECRET, APIKNAMEPARAM);
            console.log("taskPDMResponse is " + JSON.stringify(taskPDMResponse));
            //expect only a single entry
            let taskPDMJson = JSON.parse(taskPDMResponse.body);
            if (taskPDMJson.entry.length === 1) {
              let task = taskPDMJson.entry[0].resource;
              //update the task status to "completed"
              task.status = "completed";
              console.log("updated task is " + JSON.stringify(task));
              let updatedResource = await updateResourceFhirServer(task, event, fhirUpdateHelper, APIKEYSECRET, APIENVIRONMENT, APIKNAMEPARAM);
              console.log("updated pdm task is " + JSON.stringify(updatedResource));
            } else {
              console.log("unexpected number of tasks found: " + taskPDMResponse.total);
            }
          } catch (error) {
            console.log(error.message);
            console.log("failed to update the task in PDM --- but continuing anyway and logging for manual resolution");
          }
          // set the slot status to "busy"
          try {
            if (!slotRetrieved) {
              console.log("Slot not retrieved");
              slot = await getSlot(appointmentJson, event, searchResourcePDMObject, APIKEYSECRET, APIENVIRONMENT, APIKNAMEPARAM);
              slotRetrieved = true;
            }
            slot.status = "busy";
            let updatedResource = await updateResourceFhirServer(slot, event, fhirUpdateHelper, APIKEYSECRET, APIENVIRONMENT, APIKNAMEPARAM);
            console.log("updated pdm slot is " + JSON.stringify(updatedResource));
          } catch (error) {
            console.log(error.message);
            console.log("failed to retrieve the slot --- but continuing anyway and logging for manual resolution");
          }
          //return the resource
          let healthlakeResponse = {
            statusCode: 201,
            "headers": {
                "Content-Type": "application/fhir+json",
                "X-Response-Source": "Healthlake",
                "Location": "Appointment/" + appointmentid
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
