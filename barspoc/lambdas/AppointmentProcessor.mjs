// Filename: AppointmentProcessor.mjs

async function searchHealthlake(event, healthlakeSearchHelper, APIKEYSECRET, APIENVIRONMENT, APIKNAMEPARAM){
    let maxDuration=25000;
    try {
      console.log("searching healthlake")
      let healthlakeresponse = await healthlakeSearchHelper.getResource(event.pathParameters.appointmentid, "Appointment", "Y05868", APIENVIRONMENT, APIKEYSECRET, APIKNAMEPARAM);
      console.log("healthlake response is " + JSON.stringify(healthlakeresponse));
      let resourceResponse = JSON.parse(healthlakeresponse.body);
      return resourceResponse;
    } catch (error) {
      console.log(error);
      return false;
    }
  }
  
export const handler = async (event, healthlakeSearchHelper, getParameterCaseInsensitive, APIENVIRONMENT, APIKEYSECRET, APIKNAMEPARAM) => {
  console.log(JSON.stringify(event));
    try {
        //get the appointmentid path parameter and put into template
        const appointmentid = event.pathParameters.appointmentid;
        //try healthlake
        try {
            let resourceResponse = await searchHealthlake(event, healthlakeSearchHelper, APIKEYSECRET, APIENVIRONMENT, APIKNAMEPARAM);
            if (resourceResponse){
              //return the resource
              let healthlakeResponse = {
                statusCode: 200,
                "headers": {
                    "Content-Type": "application/fhir+json",
                    "X-Response-Source": "Healthlake"
                },
                body: JSON.stringify(resourceResponse)
              };
              console.log(JSON.stringify(healthlakeResponse));
              return healthlakeResponse;
            }
            else {
              console.log("searchHealthlake failed");
              let response = {
                statusCode: 500,
                "headers": {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ "result": "searchHealthlake failed" })
              }
              return response;
            }
          } catch (error) {
            console.log("caught an unexpected error processing data from healthlake");
            throw error;
          }
  
        let response1 = {
            statusCode: 200,
            "headers": {
                "Content-Type": "application/fhir+json"
            },
            body: JSON.stringify({appointmentid: appointmentid})
        };
        console.log(JSON.stringify(response1));
        return response1;

        //get the ODS code from the header
        let odscode = getParameterCaseInsensitive(event.headers, 'NHSD-End-User-Organisation-ODS');
        if (odscode === undefined && APIENVIRONMENT === "sandbox") {
          odscode = "Y05868";
        }

        console.log("getting doc from NRL");
        let nrlresponse = await get_document_ref_object_instance.getDocRef(appointmentid, odscode, APIENVIRONMENT, APIKEYSECRET, APIKNAMEPARAM);
        console.log(nrlresponse);


        let response = {
            statusCode: 200,
            "headers": {
                "Content-Type": "application/fhir+json"
            },
            body: nrlresponse.body
        };
        console.log(JSON.stringify(response));
        return response;
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
