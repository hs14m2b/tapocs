// Filename: GetAppointmentsProcessor.mjs

export const handler = async (event, findDocumentRefBarsObject, findDocumentRefPDMObject, getParameterCaseInsensitive, APIENVIRONMENT, APIKEYSECRET, APIKNAMEPARAM, NRLENABLED) => {
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

    if (NRLENABLED)
    {
      try {
        barsResponse = await findDocumentRefBarsObject.findDocRef(nhsnumber, odscode, APIENVIRONMENT, APIKEYSECRET, APIKNAMEPARAM);
        console.log("bars response is " + JSON.stringify(barsResponse));
      } catch (error) {
        console.log("find appointments from BaRS failed");
        console.log(error.message);
      }
    }
    //if barsResponse is empty, try to get the appointments from PDM
    if (barsResponse.body.entry.length === 0) {
      console.log("BaRS response is empty, trying PDM");
      try {
        //check for identity_token in the event.cookies
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
    

        barsResponse = await findDocumentRefPDMObject.findDocRef(nhsnumber, odscode, identity_token, APIENVIRONMENT, APIKEYSECRET, APIKNAMEPARAM);
        console.log("pdm response is " + JSON.stringify(barsResponse));
      } catch (error) {
        console.log("find appointments from PDM failed");
        console.log(error.message);
        throw new Error("find appointments from PDM failed");
      }
    }
    //filter out the resources have an id with a "|" in it
    barsResponse.body.entry = barsResponse.body.entry.filter((entry) => {
      return !entry.resource.id.includes("|");
    });
    console.log("filtered bars response is " + JSON.stringify(barsResponse));
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
    console.log("find appointments from BaRS failed");
    console.log(error.message);
    let response = {
      statusCode: 500,
      "headers": {
          "Content-Type": "application/json"
      },
      body: JSON.stringify({ "result": "find appointments from BaRS failed", "message": error.message })
    }
    return response;
  }
}
