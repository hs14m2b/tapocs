// Filename: GetServiceRequestsProcessor.mjs

export const handler = async (event, findServiceRequestBarsObject, getParameterCaseInsensitive, APIENVIRONMENT, APIKEYSECRET, APIKNAMEPARAM, NRLENABLED) => {
  console.log(JSON.stringify(event));
  //POST handler with a JSON body
  try {
    //get the nhsnumber from the event.body which is x-www-form-urlencoded
    if (event.isBase64Encoded) {
      event.body = Buffer.from(event.body, 'base64').toString('utf8');
    }

    let resourceJson = Object.fromEntries(new URLSearchParams(event.body));
    console.log("resourceJson is " + JSON.stringify(resourceJson));
    //expect the resourceJson to have a property nhsnumber
    let nhsnumber = resourceJson.nhsnumber;
    let odscode = "X26"; //hardcoded for the moment
    let barsResponse = {
      "body": {
        "entry": []
      }
    };

    try {
      barsResponse = await findServiceRequestBarsObject.findServiceRequest(nhsnumber, odscode, APIENVIRONMENT, APIKEYSECRET, APIKNAMEPARAM);
      console.log("bars response is " + JSON.stringify(barsResponse));
    } catch (error) {
      console.log("find ServiceRequest from BaRS failed");
      console.log(error.message);
    }
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
    console.log("find ServiceRequest from BaRS failed");
    console.log(error.message);
    let response = {
      statusCode: 500,
      "headers": {
          "Content-Type": "application/json"
      },
      body: JSON.stringify({ "result": "find ServiceRequest from BaRS failed", "message": error.message })
    }
    return response;
  }
}
