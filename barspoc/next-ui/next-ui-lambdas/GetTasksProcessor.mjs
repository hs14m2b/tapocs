// Filename: GetTasksProcessor.mjs

export const handler = async (event, findTaskPdmObject, getParameterCaseInsensitive, APIENVIRONMENT, APIKEYSECRET, APIKNAMEPARAM, NRLENABLED) => {
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
    let pdmResponse = {
      "body": {
        "entry": []
      }
    };

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
  

      pdmResponse = await findTaskPdmObject.findTasks(nhsnumber, odscode, identity_token, APIENVIRONMENT, APIKEYSECRET, APIKNAMEPARAM);
      console.log("pdm response is " + JSON.stringify(pdmResponse));
    } catch (error) {
      console.log("find tasks from PDM failed");
      console.log(error.message);
      throw new Error("find tasks from PDM failed");
    }
    //return the resource
    let pdmLambdaResponse = {
      statusCode: 200,
      "headers": {
          "Content-Type": "application/fhir+json",
          "X-Response-Source": "PDM"
      },
      body: JSON.stringify(pdmResponse)
    };
    console.log(JSON.stringify(pdmLambdaResponse));
    return pdmLambdaResponse;
  }
  catch (error) {
    console.log("find tasks from PDM failed");
    console.log(error.message);
    let response = {
      statusCode: 500,
      "headers": {
          "Content-Type": "application/json"
      },
      body: JSON.stringify({ "result": "find tasks from PDM failed", "message": error.message })
    }
    return response;
  }
}
