// Filename: GetAppointmentsProcessor.mjs

export const handler = async (event, getAppointmentBarsObject, getParameterCaseInsensitive, APIENVIRONMENT, APIKEYSECRET, APIKNAMEPARAM) => {
  console.log(JSON.stringify(event));
  //POST handler with a JSON body
  try {
    //get the nhsnumber from the event.body which is x-www-form-urlencoded
    if (event.isBase64Encoded) {
      event.body = Buffer.from(event.body, 'base64').toString('utf8');
    }

    let identity_token = "";
    try {
      // get the formdata cookie from the event.cookies array and parse it
      let formdata = "";
      for (let i = 0; i < event.cookies.length; i++) {
        if (event.cookies[i].startsWith("formdata")) {
          formdata = event.cookies[i];
          break;
        }
      }
      formdata = formdata.substring(9);
      let formData = JSON.parse(formdata);
      //get the identity_token from the formdata
      identity_token = formData.identity_token;
      
    } catch (error) {
      console.log("error getting identity_token from formdata cookie");
      console.log(error.message);
      identity_token = "";
    }
    let resourceJson = Object.fromEntries(new URLSearchParams(event.body));
    console.log("resourceJson is " + JSON.stringify(resourceJson));
    //expect the resourceJson to have a property barsserviceid and barsidentifier
    let appointmentid = resourceJson.barsidentifier;
    let barsserviceid = resourceJson.barsserviceid;
    let odscode = "X26"; //hardcoded for the moment
    let barsResponse = await getAppointmentBarsObject.getAppointment(appointmentid, identity_token, barsserviceid, odscode, APIENVIRONMENT, APIKEYSECRET, APIKNAMEPARAM);
    console.log("bars response is " + JSON.stringify(barsResponse));
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
    console.log("get appointment from BaRS failed");
    console.log(error.message);
    let response = {
      statusCode: 500,
      "headers": {
          "Content-Type": "application/json"
      },
      body: JSON.stringify({ "result": "get appointment from BaRS failed", "message": error.message })
    }
    return response;
  }
}
