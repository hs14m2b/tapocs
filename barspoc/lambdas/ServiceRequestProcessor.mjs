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
      let fhirserverresponse = (identity_token && identity_token != "") ? await fhirSearchHelper.getResourcePatient(event.pathParameters.servicerequestid, "ServiceRequest", APIENVIRONMENT, APIKEYSECRET, APIKNAMEPARAM, identity_token): await fhirSearchHelper.getResource(event.pathParameters.servicerequestid, "ServiceRequest", APIENVIRONMENT, APIKEYSECRET, APIKNAMEPARAM);
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
        const servicerequestid = event.pathParameters.servicerequestid;
        //try pdm
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
              //check that subject has an identifier value of nhs_number
              let subject = resourceResponse.subject;
              let nhs_number_found = false;
              if (subject && subject.identifier && subject.identifier.value) {
                nhs_number_found = subject.identifier.value === nhs_number;
              }
              if (nhs_number_found === false && nhs_number !== "") {
                console.log("ServiceRequest resource nhs_number does not match nhs_number in identity_token");
                let response = {
                  statusCode: 403,
                  "headers": {
                      "Content-Type": "application/json"
                  },
                  body: JSON.stringify({ "result": "ServiceRequest resource nhs_number does not match nhs_number in identity_token" })
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
