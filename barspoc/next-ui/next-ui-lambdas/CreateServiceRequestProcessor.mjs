// Filename: CreateServiceRequestProcessor.mjs

export const handler = async (event, postServiceRequestBarsObject, getParameterCaseInsensitive, APIENVIRONMENT, APIKEYSECRET, APIKNAMEPARAM, processMessage) => {
  console.log(JSON.stringify(event));
  //POST handler with a JSON body
  try {
    //get the nhsnumber from the event.body which is x-www-form-urlencoded
    if (event.isBase64Encoded) {
      event.body = Buffer.from(event.body, 'base64').toString('utf8');
    }

    let resourceJson = Object.fromEntries(new URLSearchParams(event.body));
    //expect the resourceJson to have a property nhsnumber
    let nhsnumber = resourceJson.nhsnumber;
    let barsserviceid = appointment.participant.find(p => p.actor.type == "HealthcareService").actor.identifier.value;
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
