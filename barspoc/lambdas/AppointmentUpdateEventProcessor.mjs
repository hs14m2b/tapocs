// Filename: AppointmentUpdateProcessor.mjs

async function updateResourceFhirServer(resourceJson, event, fhirUpdateHelper, APIKEYSECRET, APIENVIRONMENT, APIKNAMEPARAM){
    let maxDuration=25000;
    try {
      //get the posted resource
      let headersJson = event.headers;
      console.log("putting to FHIR Server")
      let fhirServerResponse = await fhirUpdateHelper.updateResource(resourceJson, resourceJson.resourceType, headersJson, APIENVIRONMENT, APIKEYSECRET, APIKNAMEPARAM);
      console.log("FHIR Server response is " + JSON.stringify(fhirServerResponse));
      return fhirServerResponse;
    } catch (error) {
      console.log(error);
      return false;
    }
  }

async function processCancellation(odscode, appointment, event, fhirCreateHelper, fhirUpdateHelper, fhirSearchHelper, fhirDeleteHelper, putDocumentRefBarsObject, getDocumentRefBarsObject, findDocumentRefBarsObject, snsCommonFunctionObjectInstance, getParameterCaseInsensitive, APIENVIRONMENT, APIKEYSECRET, APIKNAMEPARAM, NRLENABLED, APPTREBOOKTOPICARN) {
  console.log("processing cancellation event for appointment " + JSON.stringify(appointment));
  try {
      if (NRLENABLED) {
        //try updating the BaRS/NRL DocumentReference
        console.log("NRL is enabled, so updating DocumentReference in BaRS");
        try {
          let documentReference = {};
          try {
            //get the id of the DocumentReference from the appointment meta tag
            let barsTag = appointment.meta.tag.find(k => k.display.startsWith("DocumentReference"));
            let documentReferenceId = barsTag.display.split("|").pop();
            //retrieve the DocumentReference from BaRS
            console.log("getting the Document Reference from BaRS");
            documentReference = (await getDocumentRefBarsObject.getDocRef(documentReferenceId, odscode, APIENVIRONMENT, APIKEYSECRET, APIKNAMEPARAM)).body;
            console.log("documentReference is " + JSON.stringify(documentReference));
          } catch (error) {
            console.log(error);
            console.log("get Document Reference failed - searching instead");
            //find the participant.actor of type Patient in the appointment
            let patientReference = appointment.participant.find(k => k.actor.type == "Patient");
            console.log("patient reference is " + JSON.stringify(patientReference));
            let nhsNumber = patientReference.actor.identifier.value;
            console.log("nhsNumber is " + nhsNumber);
            console.log("searching  Document References from BaRS");
            let documentReferences = (await findDocumentRefBarsObject.findDocRef(nhsNumber, odscode, APIENVIRONMENT, APIKEYSECRET, APIKNAMEPARAM)).body;
            console.log("documentReferences are " + JSON.stringify(documentReferences));
            //find the DocumentReference with the docRef.resource.identifier.find(identifier => identifier.system == "https://fhir.nhs.uk/Id/BaRS-Identifier").value == appointment.id
            documentReference = documentReferences.entry.find(entry => entry.resource.identifier.find(identifier => identifier.system == "https://fhir.nhs.uk/Id/BaRS-Identifier").value == appointment.id).resource;
            console.log("documentReference is " + JSON.stringify(documentReference));
          }
          //delete the DocumentReference in BaRS
          //TO BE IMPLEMENTED
          //let barsResponse = await putDocumentRefBarsObject.updateDocRef(documentReference, APIENVIRONMENT, APIKEYSECRET, APIKNAMEPARAM);
          //console.log("bars response to updating the Document Reference is " + JSON.stringify(barsResponse));
          console.log("deleting DocumentReference in BaRS to be implemented");
        } catch (error) {
          console.log("updating DocumentReference failed");
          console.log(error);
        }
      }
      console.log("Updating the DocumentReference in PDM if one exists");
      try {
        let documentReference = {};
        try {
          //get the id of the DocumentReference from the appointment neta tag
          let barsTag = appointment.meta.tag.find(k => k.display.startsWith("PDMDocumentReference"));
          let documentReferenceId = barsTag.display.split("|").pop();
          //retrieve the DocumentReference from PDM
          console.log("getting the Document Reference from PDM with id " + documentReferenceId);
          documentReference = JSON.parse((await fhirSearchHelper.getResource( documentReferenceId, "DocumentReference", APIENVIRONMENT, APIKEYSECRET, APIKNAMEPARAM)).body);
          console.log("documentReference is " + JSON.stringify(documentReference));
        } catch (error) {
          console.log(error);
          console.log("get Document Reference by id failed - searching by patient nhs number instead");
          //find the participant.actor of type Patient in the appointment
          let patientReference = appointment.participant.find(k => k.actor.type == "Patient");
          console.log("patient reference is " + JSON.stringify(patientReference));
          let nhsNumber = patientReference.actor.identifier.value;
          console.log("nhsNumber is " + nhsNumber);
          console.log("searching  Document References from PDM");
          let searchObject = {"patient:identifier" : "https://fhir.nhs.uk/Id/nhs-number|" + nhsNumber};

          let documentReferences = JSON.parse((await fhirSearchHelper.searchResource(searchObject, "DocumentReference", odscode, APIENVIRONMENT, APIKEYSECRET, APIKNAMEPARAM)).body);
          console.log("documentReferences found in PDM are " + JSON.stringify(documentReferences));
          //find the DocumentReference with the docRef.resource.identifier.find(identifier => identifier.system == "https://fhir.nhs.uk/Id/BaRS-Identifier").value == appointment.id
          documentReference = documentReferences.entry.find(entry => entry.resource.identifier.find(identifier => identifier.system == "https://fhir.nhs.uk/Id/BaRS-Identifier").value == appointment.id).resource;
          console.log("documentReference is " + JSON.stringify(documentReference));
        }
        //delete the DocumentReference in PDM
        let documentReferenceId = documentReference.id;
        let documentReferenceVersionId = documentReference.meta.versionId;
        //(id, versionId, resourceType, headersJson, org, APIENVIRONMENT, APIKEYSECRET, APIKNAMEPARAM)
        let pdmResponse = await fhirDeleteHelper.deleteResource(documentReferenceId, documentReferenceVersionId, "DocumentReference", event.headers, odscode, APIENVIRONMENT, APIKEYSECRET, APIKNAMEPARAM);
        console.log("PDM response to deleting the Document Reference is " + pdmResponse);
      } catch (error) {
        console.log("deleting DocumentReference in PDM failed");
        console.log(error);
      }
      try {
        //find and update the ServiceRequest related to the appointment
        console.log("finding and updating the ServiceRequest related to the appointment");
        let serviceRequest = appointment.basedOn.find(ref => ref.type == "ServiceRequest");
        let serviceRequestResource;
        if (serviceRequest) {
          console.log("updating ServiceRequest " + serviceRequest.reference);
          serviceRequestResource = JSON.parse((await fhirSearchHelper.getResource(serviceRequest.reference.split("/").pop(), "ServiceRequest", APIENVIRONMENT, APIKEYSECRET, APIKNAMEPARAM)).body);
          //update the ServiceRequest status to draft
          serviceRequestResource.status = "draft";
          let fhirServerUpdateResponse = await fhirUpdateHelper.updateResource(serviceRequestResource, serviceRequestResource.resourceType, event.headers, APIENVIRONMENT, APIKEYSECRET, APIKNAMEPARAM);
          console.log("ServiceRequest update response is " + JSON.stringify(fhirServerUpdateResponse));
        }
        else {
          console.log("No ServiceRequest found in appointment.basedOn");
        }
        if (serviceRequest) {
           // find and update the outstanding Task related to the ServiceRequest
          try {
            let taskQueryStrings ={
              "focus" : "ServiceRequest/" + serviceRequestResource.id
            };
            let taskPDMResponse =  await fhirSearchHelper.searchResource(taskQueryStrings, "Task", odscode, APIENVIRONMENT, APIKEYSECRET, APIKNAMEPARAM);
            console.log("taskPDMResponse is " + JSON.stringify(taskPDMResponse));
            //expect only a single entry
            let taskPDMJson = JSON.parse(taskPDMResponse.body);
            if (taskPDMJson.entry.length === 1) {
              let task = taskPDMJson.entry[0].resource;
              //update the task status to "ready"
              task.status = "ready";
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
        }
      } catch (error) {
        console.log("updating the ServiceRequest in PDM failed");
        console.log(error);
        throw(error);
      }
      //return OK
      return "OK";
      
    } catch (error) {
    console.log("updating appointment failed");
    console.log(error);
  }


}

async function processRebooking(odscode, appointment, originalSlotResource, event, fhirCreateHelper, fhirUpdateHelper, fhirSearchHelper, fhirDeleteHelper, putDocumentRefBarsObject, getDocumentRefBarsObject, findDocumentRefBarsObject, snsCommonFunctionObjectInstance, getParameterCaseInsensitive, APIENVIRONMENT, APIKEYSECRET, APIKNAMEPARAM, NRLENABLED, APPTREBOOKTOPICARN) {
  console.log("processing rebooking for appointment " + JSON.stringify(appointment));
  try {
    console.log("Updating the original slot to free");
    let updatedOriginalSlot = await updateResourceFhirServer(originalSlotResource, event, fhirUpdateHelper, APIKEYSECRET, APIENVIRONMENT, APIKNAMEPARAM);
  } catch (error) {
    console.log("updating original slot failed");
    console.log(error);
  }
  if (NRLENABLED) {
    //try updating the BaRS/NRL DocumentReference
    console.log("updating DocumentReference in BaRS");
    try {
      let documentReference = {};
      try {
        //get the id of the DocumentReference from the appointment neta tag
        let barsTag = appointment.meta.tag.find(k => k.display.startsWith("DocumentReference"));
        let documentReferenceId = barsTag.display.split("|").pop();
        //retrieve the DocumentReference from BaRS
        console.log("getting the Document Reference from BaRS");
        documentReference = (await getDocumentRefBarsObject.getDocRef(documentReferenceId, odscode, APIENVIRONMENT, APIKEYSECRET, APIKNAMEPARAM)).body;
        console.log("documentReference is " + JSON.stringify(documentReference));
      } 
      catch (error) {
        console.log(error);
        console.log("get Document Reference failed - searching instead");
        //find the participant.actor of type Patient in the appointment
        let patientReference = appointment.participant.find(k => k.actor.type == "Patient");
        console.log("patient reference is " + JSON.stringify(patientReference));
        let nhsNumber = patientReference.actor.identifier.value;
        console.log("nhsNumber is " + nhsNumber);
        console.log("searching  Document References from BaRS");
        let documentReferences = (await findDocumentRefBarsObject.findDocRef(nhsNumber, odscode, APIENVIRONMENT, APIKEYSECRET, APIKNAMEPARAM)).body;
        console.log("documentReferences are " + JSON.stringify(documentReferences));
        //find the DocumentReference with the docRef.resource.identifier.find(identifier => identifier.system == "https://fhir.nhs.uk/Id/BaRS-Identifier").value == appointment.id
        documentReference = documentReferences.entry.find(entry => entry.resource.identifier.find(identifier => identifier.system == "https://fhir.nhs.uk/Id/BaRS-Identifier").value == appointment.id).resource;
        console.log("documentReference is " + JSON.stringify(documentReference));
      }
      //update the DocumentReference context period
      let { start, end } = appointment;
      documentReference.context.period.start = start;
      documentReference.context.period.end = end;
      //update the DocumentReference in BaRS
      let barsResponse = await putDocumentRefBarsObject.updateDocRef(documentReference, APIENVIRONMENT, APIKEYSECRET, APIKNAMEPARAM);
      console.log("bars response to updating the Document Reference is " + JSON.stringify(barsResponse));
    } catch (error) {
      console.log("updating DocumentReference failed");
      console.log(error);
    }
  }

  console.log("Updating the DocumentReference in PDM if required");
  try {
    let documentReference = {};
    try {
      //get the id of the DocumentReference from the appointment neta tag
      let barsTag = appointment.meta.tag.find(k => k.display.startsWith("PDMDocumentReference"));
      let documentReferenceId = barsTag.display.split("|").pop();
      //retrieve the DocumentReference from PDM
      console.log("getting the Document Reference from PDM");
      documentReference = JSON.parse((await fhirSearchHelper.getResource( documentReferenceId, "DocumentReference", APIENVIRONMENT, APIKEYSECRET, APIKNAMEPARAM)).body);
      console.log("documentReference is " + JSON.stringify(documentReference));
    } catch (error) {
      console.log(error);
      console.log("get Document Reference failed - searching instead");
      //find the participant.actor of type Patient in the appointment
      let patientReference = appointment.participant.find(k => k.actor.type == "Patient");
      console.log("patient reference is " + JSON.stringify(patientReference));
      let nhsNumber = patientReference.actor.identifier.value;
      console.log("nhsNumber is " + nhsNumber);
      console.log("searching  Document References from PDM");
      let searchObject = {"patient:identifier" : "https://fhir.nhs.uk/Id/nhs-number|" + nhsNumber};

      let documentReferences = JSON.parse((await fhirSearchHelper.searchResource(searchObject, "DocumentReference", odscode, APIENVIRONMENT, APIKEYSECRET, APIKNAMEPARAM)).body);
      console.log("documentReferences are " + JSON.stringify(documentReferences));
      //find the DocumentReference with the docRef.resource.identifier.find(identifier => identifier.system == "https://fhir.nhs.uk/Id/BaRS-Identifier").value == appointment.id
      documentReference = documentReferences.entry.find(entry => entry.resource.identifier.find(identifier => identifier.system == "https://fhir.nhs.uk/Id/BaRS-Identifier").value == appointment.id).resource;
      console.log("documentReference is " + JSON.stringify(documentReference));
    }
    //update the DocumentReference context period
    let { start, end } = appointment;
    documentReference.context.period.start = start;
    documentReference.context.period.end = end;
    //update the DocumentReference in PDM
    let barsResponse = await updateResourceFhirServer(documentReference, event, fhirUpdateHelper, APIKEYSECRET, APIENVIRONMENT, APIKNAMEPARAM);
    console.log("PDM response to updating the Document Reference is " + JSON.stringify(barsResponse));
    return "OK";
  } catch (error) {
    console.log("updating DocumentReference in PDM failed");
    console.log(error);
  }
}

export const handler = async (event, fhirCreateHelper, fhirUpdateHelper, fhirSearchHelper, fhirDeleteHelper, putDocumentRefBarsObject, getDocumentRefBarsObject, findDocumentRefBarsObject, snsCommonFunctionObjectInstance, getParameterCaseInsensitive, APIENVIRONMENT, APIKEYSECRET, APIKNAMEPARAM, NRLENABLED, APPTREBOOKTOPICARN) => {
  console.log(JSON.stringify(event));
  let messageJson;
  try {
    for (let record of event.Records) {
      let messageString = record.Sns.Message;
      messageJson = JSON.parse(messageString);
      console.log("Message is " + JSON.stringify(messageJson));
    }
  } catch (error) {
    console.log("Error processing SNS event");
    console.log(error);
  }

  if (!messageJson || !messageJson.event || !messageJson.appointment) {
    console.log("No event or appointment found in message");
    let response = {
      statusCode: 400,
      "headers": {
          "Content-Type": "application/json"
      },
      body: JSON.stringify({ "result": "No event or appointment found in message" })
    }
    return response;
  }
  try {
    let odscode = "X26"; //hardcoded for the moment
    //get the appointment from the event.body which may be base64 encoded
    let appointment = messageJson.appointment;
    console.log("appointment from SNS message is " + JSON.stringify(appointment));
    event = messageJson.event;
    //check if we are dealing with a cancellation
    if (appointment.status && appointment.status == "cancelled" && messageJson.eventType == "AppointmentCancellation") {
      return await processCancellation(odscode, appointment, messageJson.event, fhirCreateHelper, fhirUpdateHelper, fhirSearchHelper, fhirDeleteHelper, putDocumentRefBarsObject, getDocumentRefBarsObject, findDocumentRefBarsObject, snsCommonFunctionObjectInstance, getParameterCaseInsensitive, APIENVIRONMENT, APIKEYSECRET, APIKNAMEPARAM, NRLENABLED, APPTREBOOKTOPICARN);
    }
    if (appointment.status && (appointment.status == "booked" || appointment.status == "fulfilled" || appointment.status == "noshow" || appointment.status == "arrived" || appointment.status == "checked-in" || appointment.status == "waitlist") && messageJson.eventType == "AppointmentReschedule") {
      let originalSlotResource = messageJson.originalSlot;
      if (!originalSlotResource) {
        console.log("No original slot resource found in message - cannot process reschedule");
      }
      else {
        return await processRebooking(odscode, appointment, originalSlotResource, messageJson.event, fhirCreateHelper, fhirUpdateHelper, fhirSearchHelper, fhirDeleteHelper, putDocumentRefBarsObject, getDocumentRefBarsObject, findDocumentRefBarsObject, snsCommonFunctionObjectInstance, getParameterCaseInsensitive, APIENVIRONMENT, APIKEYSECRET, APIKNAMEPARAM, NRLENABLED, APPTREBOOKTOPICARN);
      }
    }
    console.log("No action taken - not a recognised appointment update event");
    let response = {
      statusCode: 400,
      "headers": {
          "Content-Type": "application/json"
      },
      body: JSON.stringify({ "result": "No action taken - not a recognised appointment update event" })
    }
    return response;
  } catch (error) {
    console.log("Error processing appointment update event");
    console.log(error);
  }
}

