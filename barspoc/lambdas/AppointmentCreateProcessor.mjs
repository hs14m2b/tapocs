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
      let healthlakeresponse = await fhirCreateHelper.createResource(resourceJson, "Appointment", headersJson, APIENVIRONMENT, APIKEYSECRET, APIKNAMEPARAM);
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
      let healthlakeresponse = await fhirUpdateHelper.updateResource(resourceJson, "Appointment", headersJson, APIENVIRONMENT, APIKEYSECRET, APIKNAMEPARAM);
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

export const handler = async (event, fhirCreateHelper, fhirUpdateHelper, postDocumentRefBarsObject, postDocumentRefPDMObject, getParameterCaseInsensitive, APIENVIRONMENT, APIKEYSECRET, APIKNAMEPARAM, NRLENABLED) => {
  console.log(JSON.stringify(event));
  //POST handler for a new appointment
    try {
      //try pdm
      try {
          let resourceResponse = await createResourceFhirServer(event, fhirCreateHelper, APIKEYSECRET, APIENVIRONMENT, APIKNAMEPARAM);
          if (resourceResponse){
            //get the id of the resource
            let appointmentid = resourceResponse.id;
            if (NRLENABLED) {
              try {
                //create DocumentReference entry in BaRS/NRL
                //returns a json object with "body" and "headers" - header location contains the id of the new resource
                let barsResponse = await createDocumentRefBars(resourceResponse, event, postDocumentRefBarsObject, APIENVIRONMENT, APIKEYSECRET, APIKNAMEPARAM);
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
              let pdmDocRefResponse = await createDocumentRefBars(resourceResponse, event, postDocumentRefPDMObject, APIENVIRONMENT, APIKEYSECRET, APIKNAMEPARAM);
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
