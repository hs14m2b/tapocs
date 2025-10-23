// Filename: GetAppointmentsProcessor.mjs

export const handler = async (event, findSlotsBarsObject, getParameterCaseInsensitive, APIENVIRONMENT, APIKEYSECRET, APIKNAMEPARAM) => {
  console.log(JSON.stringify(event));
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

    //expect the event to have a property barsserviceid and healthcareServiceId
    let healthcareServiceId;
    try {
      healthcareServiceId = event.parameters.find(param => param.name === "healthcareserviceid").value;
      // if healthcareServiceId has a "/" then get the characters after the last "/"
      if (healthcareServiceId.lastIndexOf("/") > -1) {
        healthcareServiceId = healthcareServiceId.substring(healthcareServiceId.lastIndexOf("/") + 1);
      }
    } catch (error) {
      healthcareServiceId = "9f00342d-70de-38d5-9176-af97f1ba1b3d"; //default for testing
    }
    let barsserviceid;
    try {
      barsserviceid = event.parameters.find(param => param.name === "dosserviceid").value;
    } catch (error) {
      barsserviceid = "matthewbrown"; //default for testing
    }
    let odscode = "X26"; //hardcoded for the moment
    let barsResponse = await findSlotsBarsObject.findSlots(healthcareServiceId, barsserviceid, odscode, APIENVIRONMENT, APIKEYSECRET, APIKNAMEPARAM);
    let mappedSlots = [];
    if (barsResponse.body.entry && barsResponse.body.entry.length > 0) {
      mappedSlots = barsResponse.body.entry.map((entry) => {
        return entry.resource;
      });
    }
    response.response.functionResponse["responseBody"]["TEXT"] =  {"body": JSON.stringify(mappedSlots) };
      
    console.log("filtered bars response is " + JSON.stringify(mappedSlots));
    return response;
  }
  catch (error) {
    console.log("find slots from BaRS failed");
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
              "body": JSON.stringify({"result": "find slots from BaRS failed", "message": error.message})
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
