// Filename: GetAppointmentsProcessor.mjs

export const handler = async (event, putAppointmentBarsObject, getParameterCaseInsensitive, APIENVIRONMENT, APIKEYSECRET, APIKNAMEPARAM) => {
  console.log(JSON.stringify(event));
  //POST handler with a JSON body
  try {
    //get the nhsnumber from the event.body which is x-www-form-urlencoded
    if (event.isBase64Encoded) {
      event.body = Buffer.from(event.body, 'base64').toString('utf8');
    }

    let resourceJson = Object.fromEntries(new URLSearchParams(event.body));
    let { appointmentb64, barsserviceid } = resourceJson;
    let appointment = JSON.parse(Buffer.from(appointmentb64, 'base64').toString('utf8'));
    console.log("appointment is " + JSON.stringify(appointment));
    console.log("resourceJson is " + JSON.stringify(resourceJson));
    //remove start and end from slot to appointment resource
    delete appointment.start;
    delete appointment.end;
    delete appointment.slot;
    //set appointment status to cancelled
    appointment.status = "cancelled";
    appointment.extension.find((extension) => extension.url == "https://fhir.nhs.uk/StructureDefinition/Extension-Appointment-Status").valueCoding.code = "cancelled";
    console.log("appointment after deleting slot details is " + JSON.stringify(appointment));
    let odscode = "X26"; //hardcoded for the moment
    let barsResponse = await putAppointmentBarsObject.putAppointment(appointment, barsserviceid, odscode, APIENVIRONMENT, APIKEYSECRET, APIKNAMEPARAM);
    console.log("bars response to updating appointment is " + JSON.stringify(barsResponse));
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
    console.log("find slots from BaRS failed");
    console.log(error.message);
    let response = {
      statusCode: 500,
      "headers": {
          "Content-Type": "application/json"
      },
      body: JSON.stringify({ "result": "find slots from BaRS failed", "message": error.message })
    }
    return response;
  }
}
