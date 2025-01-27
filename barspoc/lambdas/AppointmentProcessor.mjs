// Filename: AppointmentProcessor.mjs
export const handler = async (event, getParameterCaseInsensitive, APIENVIRONMENT, APIKEYSECRET, APIKNAMEPARAM) => {
  console.log(JSON.stringify(event));
    try {
        //get the appointmentid path parameter and put into template
        const appointmentid = event.pathParameters.appointmentid;

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
