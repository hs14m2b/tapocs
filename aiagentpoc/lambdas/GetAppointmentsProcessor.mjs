// Filename: GetAppointmentsProcessor.mjs

export const handler = async (event, findDocumentRefBarsObject, findDocumentRefPDMObject, getParameterCaseInsensitive, APIENVIRONMENT, APIKEYSECRET, APIKNAMEPARAM, NRLENABLED) => {
  console.log(JSON.stringify(event));
  //sample event
  /*
  { "inputText": "Whatare my appointments?", 
   "sessionId": "abc123", 
   "actionGroup": "WeatherActions", 
   "function": "getCurrentWeather", 
   "parameters": [ { "name": "nhsnumber", "type": "string", "value": "9661034524" } ], 
   "agent": { "name": "SupportAgent", "id": "xxxx", "version": "1" }, 
   "sessionAttributes": { "someKey": "someValue" }, "promptSessionAttributes": {},
    "messageVersion": "1.0" }
  */

    //sample response structure
  /*
  { "response": 
   { "actionGroup": "<same as request>", 
    "function": "<same as request>", 
    "functionResponse": { 
    "responseBody": { 
    "application/json": { "body": { /Arbitrary JSON that represents the function result / } } } 
    }, 
    "sessionAttributes": { / (optional) updated session attributes / }, 
    "promptSessionAttributes": { / (optional) updated prompt-time attributes / },
    "messageVersion": "1.0" } 
  }
  */

  try {
    let response = {
      "messageVersion": "1.0",
      "response": {
        "actionGroup": event.actionGroup,
        "function": event.function,
        "functionResponse": {
          "responseBody": {
            "TEXT": { 
              "body": ""
            }
          }
        }
      },
      "sessionAttributes": event.sessionAttributes,
      "promptSessionAttributes": event.promptSessionAttributes
    };
    //get the nhsnumber from the parameter which is an array of objects with name, type and value
    //example: "parameters": [ { "name": "nhsnumber", "type": "string", "value": "9661034524" } ]
    let nhsnumber;
    try {
      nhsnumber = event.parameters.find(param => param.name === "nhsnumber").value;
    } catch (error) {
      nhsnumber = "9661034524"; //default for testing
    }
    //check if nhs number is present in sessionAttributes
    if (event.sessionAttributes && event.sessionAttributes.nhsnumber) {
      if (nhsnumber !== event.sessionAttributes.nhsnumber) {
        throw new Error("nhsnumber in parameters does not match nhsnumber in sessionAttributes");
      }
    }
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
        barsResponse = await findDocumentRefPDMObject.findDocRef(nhsnumber, odscode, identity_token, APIENVIRONMENT, APIKEYSECRET, APIKNAMEPARAM);
        console.log("pdm response is " + JSON.stringify(barsResponse));
      } catch (error) {
        console.log("find appointments from PDM failed");
        console.log(error.message);
        throw new Error("find appointments from PDM failed");
      }
    }
    //filter out the resources have an id with a "|" in it
    if (barsResponse.body.entry && barsResponse.body.entry.length > 0) {
      barsResponse.body.entry = barsResponse.body.entry.filter((entry) => {
        return !entry.resource.id.includes("|");
      });
    }
    //filter out the resources with context period.start in the past
    let currentDate = new Date();
    if (barsResponse.body.entry && barsResponse.body.entry.length > 0) {
      barsResponse.body.entry = barsResponse.body.entry.filter((entry) => {
        if (entry.resource.context && entry.resource.context.period && entry.resource.context.period.start) {
          let periodStartDate = new Date(entry.resource.context.period.start);
          return periodStartDate >= currentDate;
        }
        return false; //evict the resource if no context period start
      });
    }
    let mappedAppointments = [];
    if (barsResponse.body.entry && barsResponse.body.entry.length > 0) {
      mappedAppointments = barsResponse.body.entry.map((entry) => {
        return entry.resource;
      });
    }
    response.response.functionResponse["responseBody"]["TEXT"] =  {"body": JSON.stringify(mappedAppointments) };
      
    console.log("filtered bars response is " + JSON.stringify(mappedAppointments));
    //return the resource
    //response.response.functionResponse["responseBody"] = {"application/json": {"body": barsResponse.body } };
    console.log(JSON.stringify(response));
    return response;
  }
  catch (error) {
    console.log("find appointments from BaRS failed");
    let response =
    {
      "messageVersion": "1.0",
      "response": {
        "actionGroup": event.actionGroup,
        "function": event.function,
        "functionResponse": {
          "responseState": "FAILURE",
          "responseBody": {
            "TEXT": { 
              "body": JSON.stringify({"result": "find appointments from BaRS failed", "message": error.message})
            }
          }
        }
      },
      "sessionAttributes": event.sessionAttributes,
      "promptSessionAttributes": event.promptSessionAttributes
    };
    console.log(error.message);
    console.log(JSON.stringify(response));
    return response;
  }
}
