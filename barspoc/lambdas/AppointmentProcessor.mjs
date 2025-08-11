// Filename: AppointmentProcessor.mjs
import jwt from 'jsonwebtoken';

async function searchFhirServer(event, fhirSearchHelper, APIKEYSECRET, APIENVIRONMENT, APIKNAMEPARAM, getParameterCaseInsensitive){
    let maxDuration=25000;
    try {
      console.log("searching fhir server")
      let identity_token;
      try {
        identity_token = getParameterCaseInsensitive(event.headers, 'nhsd-id-token');
      } catch (error) {
        console.log("error getting identity_token from http headers");
        console.log(error.message);
        identity_token = "";
      }
      let fhirserverresponse = (identity_token && identity_token != "") ? await fhirSearchHelper.getResourcePatient(event.pathParameters.appointmentid, "Appointment", APIENVIRONMENT, APIKEYSECRET, APIKNAMEPARAM, identity_token): await fhirSearchHelper.getResource(event.pathParameters.appointmentid, "Appointment", APIENVIRONMENT, APIKEYSECRET, APIKNAMEPARAM);
      console.log("fhir server response is " + JSON.stringify(fhirserverresponse));
      let resourceResponse = JSON.parse(fhirserverresponse.body);
      return resourceResponse;
    } catch (error) {
      console.log(error);
      return false;
    }
  }
  
export const handler = async (event, fhirSearchHelper, getParameterCaseInsensitive, APIENVIRONMENT, APIKEYSECRET, APIKNAMEPARAM) => {
  console.log(JSON.stringify(event));
    try {
        //get the appointmentid path parameter and put into template
        const appointmentid = event.pathParameters.appointmentid;
        //try healthlake
        try {
            let resourceResponse = await searchFhirServer(event, fhirSearchHelper, APIKEYSECRET, APIENVIRONMENT, APIKNAMEPARAM, getParameterCaseInsensitive);
            if (resourceResponse){
              //check if nhs login token is present
              let nhs_number = "";
              try {
                let identity_token = getParameterCaseInsensitive(event.headers, 'nhsd-id-token');
                const decoded = jwt.decode(identity_token);
                console.log("decoded identity_token is " + JSON.stringify(decoded));
                nhs_number = decoded.nhs_number;
                console.log("nhsnumber is " + nhs_number);
              } catch (error) {
                console.log("error getting identity_token from headers");
                console.log(error.message);
                nhs_number = "";
              }
              //check that participant actor type of Patient has an identifier value of nhs_number
              let participant = resourceResponse.participant;
              let nhs_number_found = false;
              for (let i = 0; i < participant.length; i++) {
                if (participant[i].actor.type =="Patient") {
                  //check if the actor has an identifier
                  if (participant[i].actor.identifier === undefined) {
                    console.log("actor has no identifier");
                    continue;
                  }
                  //check if the actor has an identifier value
                  if (participant[i].actor.identifier.value === undefined) {
                    console.log("actor identifier has no value");
                    continue;
                  }
                  //check if the actor identifier value is the same as nhs_number
                  //console.log("actor identifier value is " + participant[i].actor.identifier.value);
                  //console.log("nhs_number is " + nhs_number);
                  let patientid = participant[i].actor.identifier.value;
                  console.log("patientid is " + patientid);
                  if (patientid === nhs_number) {
                    nhs_number_found = true;
                    break;
                  }
                }
              }
              if (nhs_number_found === false && nhs_number !== "") {
                console.log("Appointment resource nhs_number does not match nhs_number in identity_token");
                let response = {
                  statusCode: 403,
                  "headers": {
                      "Content-Type": "application/json"
                  },
                  body: JSON.stringify({ "result": "Appointment resource nhs_number does not match nhs_number in identity_token" })
                }
                return response;
              }
              //return the resource
              let fhirServerResponse = {
                statusCode: 200,
                "headers": {
                    "Content-Type": "application/fhir+json",
                    "X-Response-Source": "FHIR Server"
                },
                body: JSON.stringify(resourceResponse)
              };
              console.log(JSON.stringify(fhirServerResponse));
              return fhirServerResponse;
            }
            else {
              console.log("searchFhirServer failed");
              let response = {
                statusCode: 500,
                "headers": {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ "result": "searchFhirServer failed" })
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
