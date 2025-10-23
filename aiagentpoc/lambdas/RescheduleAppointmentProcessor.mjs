// Filename: GetAppointmentProcessor.mjs

export const handler = async (event, getAppointmentBarsObject, putAppointmentBarsObject, getParameterCaseInsensitive, APIENVIRONMENT, APIKEYSECRET, APIKNAMEPARAM) => {
  console.log(JSON.stringify(event));
  //POST handler with a JSON body
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
 
    //expect the resourceJson to have a property barsserviceid and barsidentifier and slotid and slotstart and slotend
    let appointmentid;
    try {
      appointmentid = event.parameters.find(param => param.name === "barsidentifier").value;
    } catch (error) {
      appointmentid = "341c5df1-f612-358b-8c27-2e6744ee0db9"; //default for testing
    }
    let barsserviceid;
    try {
      barsserviceid = event.parameters.find(param => param.name === "dosserviceid").value;
    } catch (error) {
      barsserviceid = "matthewbrown"; //default for testing
    }
    let slotid;
    try {
      slotid = event.parameters.find(param => param.name === "slotid").value;
    } catch (error) {
      throw new Error("slotid parameter is required");
    }
    let slotstart;
    try {
      slotstart = event.parameters.find(param => param.name === "slotstart").value;
    } catch (error) {
      throw new Error("slotstart parameter is required");
    }
    let slotend;
    try {
      slotend = event.parameters.find(param => param.name === "slotend").value;
    } catch (error) {
      throw new Error("slotend parameter is required");
    }
    //check if nhs number is present in sessionAttributes
    let nhsnumber;
    if (event.sessionAttributes && event.sessionAttributes.nhsnumber) {
      nhsnumber = event.sessionAttributes.nhsnumber;
    }
    let odscode = "X26"; //hardcoded for the moment
    let barsResponse = await getAppointmentBarsObject.getAppointment(appointmentid, null, barsserviceid, odscode, APIENVIRONMENT, APIKEYSECRET, APIKNAMEPARAM);
    console.log("bars response is " + JSON.stringify(barsResponse));
    //check if the response is valid appointment (including check for nhs number match with the nhsnumber present in sessionAttributes)
    let appointment = barsResponse.body;
    if (!appointment || appointment.resourceType !== "Appointment") {
      throw new Error("Invalid appointment received from BaRS");
    }
    //copy start and end from slot to appointment resource
    appointment.start = slotstart;
    appointment.end = slotend;
    //copy the slot id to the appointment resource
    appointment.slot = [{"reference": "Slot/"+slotid}];
    barsResponse = await putAppointmentBarsObject.putAppointment(appointment, barsserviceid, odscode, APIENVIRONMENT, APIKEYSECRET, APIKNAMEPARAM);
    //return the resource
    response.response.functionResponse["responseBody"]["TEXT"] =  {"body": JSON.stringify(barsResponse.body) };
    return response;
  }
  catch (error) {
    console.log("get appointment from BaRS failed");
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
              "body": JSON.stringify({"result": "retrieving appointment details from BaRS failed", "message": error.message})
            }
          }
        }
      },
      "sessionAttributes": event.sessionAttributes,
      "promptSessionAttributes": event.promptSessionAttributes
    };
    console.log(JSON.stringify(response));
    return response;
  }
}
