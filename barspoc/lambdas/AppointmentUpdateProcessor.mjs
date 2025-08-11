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
  

export const handler = async (event, fhirCreateHelper, fhirUpdateHelper, fhirSearchHelper, putDocumentRefBarsObject, getDocumentRefBarsObject, findDocumentRefBarsObject, getParameterCaseInsensitive, APIENVIRONMENT, APIKEYSECRET, APIKNAMEPARAM, NRLENABLED) => {
  console.log(JSON.stringify(event));
  //PUT handler for updating an appointment
    try {
      let odscode = "X26"; //hardcoded for the moment
      //get the appointment from the event.body which may be base64 encoded
      if (event.isBase64Encoded) {
        event.body = Buffer.from(event.body, 'base64').toString('utf8');
      }
      let appointment = JSON.parse(event.body);
      console.log("appointment to be updated is " + JSON.stringify(appointment));
      //TODO - find old slot and set to free
      let getResult = await fhirSearchHelper.getResource(appointment.id, "Appointment", APIENVIRONMENT, APIKEYSECRET, APIKNAMEPARAM);
      let originalAppointment = JSON.parse(getResult.body);
      console.log("original appointment is " + JSON.stringify(originalAppointment));
      try {
        let originalSlot = originalAppointment.slot[0];
        let originalSlotId = originalSlot.reference.split("/").pop();
        let originalSlotGetResult = await fhirSearchHelper.getResource(originalSlotId, "Slot", APIENVIRONMENT, APIKEYSECRET, APIKNAMEPARAM);
        let originalSlotResource = JSON.parse(originalSlotGetResult.body);
        console.log("original slot is " + JSON.stringify(originalSlotResource));
        originalSlotResource.status = "free";
        let updatedOriginalSlot = await updateResourceFhirServer(originalSlotResource, event, fhirUpdateHelper, APIKEYSECRET, APIENVIRONMENT, APIKNAMEPARAM);
      } catch (error) {
        console.log("updating original slot failed");
        console.log(error);
      }
      try {
        //find new slot and set to busy
        let newSlotId = appointment.slot[0].reference.split("/").pop();
        let newSlotGetResult = await fhirSearchHelper.getResource( newSlotId, "Slot", APIENVIRONMENT, APIKEYSECRET, APIKNAMEPARAM);
        let newSlotResource = JSON.parse(newSlotGetResult.body);
        console.log("new slot is " + JSON.stringify(newSlotResource));
        //update the slot status
        newSlotResource.status = "busy";
        let updatedSlot = await updateResourceFhirServer(newSlotResource, event, fhirUpdateHelper, APIKEYSECRET, APIENVIRONMENT, APIKNAMEPARAM);
        console.log("updated slot is " + JSON.stringify(updatedSlot));
      } catch (error) {
        console.log("updating new slot failed");
        console.log(error);
      }
      //update the appointment
      console.log("updating appointment details in healthlake");
      let updatedResource = await updateResourceFhirServer(appointment, event, fhirUpdateHelper, APIKEYSECRET, APIENVIRONMENT, APIKNAMEPARAM);
      console.log("updated appointment resource is " + JSON.stringify(updatedResource));
      //if (!updatedResource.resourceType || updatedResource.resourceType !== "Appointment"){
      //    throw new Error("updateResourceFhirServer failed");
      //}
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

      console.log("Upodating the DocumentReference in PDM if required");
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
      } catch (error) {
        console.log("updating DocumentReference in PDM failed");
        console.log(error);
      }
      //return the resource
      let healthlakeResponse = {
        statusCode: 200,
        "headers": {
            "Content-Type": "application/fhir+json",
            "X-Response-Source": "Healthlake",
            "Location": "Appointment/" + appointment.id
        },
        body: JSON.stringify(appointment)
      };
      console.log(JSON.stringify(healthlakeResponse));
      return healthlakeResponse;
    }
    catch (error) {
      console.log(error);
      console.log("update Appointment failed");
      let response = {
        statusCode: 500,
        "headers": {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ "result": "update Appointment failed" })
      }
      return response;
    }
}
