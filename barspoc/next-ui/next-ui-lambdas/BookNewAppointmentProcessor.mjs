// Filename: GetAppointmentsProcessor.mjs
import appointmenttemplate from './appointment-001.json' with { type: 'json' };

export const handler = async (event, sendAppointmentBarsObject, getParameterCaseInsensitive, APIENVIRONMENT, APIKEYSECRET, APIKNAMEPARAM) => {
  console.log(JSON.stringify(event));
  //POST handler with a JSON body
  try {
    if (event.isBase64Encoded) {
      event.body = Buffer.from(event.body, 'base64').toString('utf8');
      event.isBase64Encoded = false;
    }

    let resourceJson = Object.fromEntries(new URLSearchParams(event.body));
    let { slotb64, servicerequestb64, servicerequestId, barsidentifier, barsserviceid } = resourceJson;
    let appointment = JSON.parse(JSON.stringify(appointmenttemplate));
    let slot = JSON.parse(Buffer.from(slotb64, 'base64').toString('utf8'));
    let servicerequest = JSON.parse(Buffer.from(servicerequestb64, 'base64').toString('utf8'));
    console.log("slot is " + JSON.stringify(slot));
    console.log("resourceJson is " + JSON.stringify(resourceJson));
    // set appointment status = booked, description, start, end, participant actor Patient,  slot reference 
    // nhs number is expected to be in service request subject identifier value.
    let nhsnumber = servicerequest.subject.identifier.value;
    appointment.participant.push(
      {
        "actor": {
          "type": "Patient",
          "identifier": {
            "system": "https://fhir.nhs.uk/Id/nhs-number",
            "value": nhsnumber
          }
        },
        "status": "accepted"
      }
    )
    // description comes from service request code text, or code coding[0] display
    appointment.description = (servicerequest.code.text) ? servicerequest.code.text : (servicerequest.code.coding[0].display) ? servicerequest.code.coding[0].display : "";
    appointment.status = "booked";
    appointment.start = slot.start;
    appointment.end = slot.end;
    appointment.slot = [{"reference": "Slot/"+slot.id}];
    console.log("appointment is " + JSON.stringify(appointment));
    //copy start and end from slot to appointment resource
    appointment.start = slot.start;
    appointment.end = slot.end;
    //copy the slot id to the appointment resource
    appointment.slot = [{"reference": "Slot/"+slot.id}];
    console.log("appointment after copying slot details is " + JSON.stringify(appointment));
    let odscode = "X26"; //hardcoded for the moment
    let barsResponse = await sendAppointmentBarsObject.postAppointment(appointment, barsserviceid, odscode, APIENVIRONMENT, APIKEYSECRET, APIKNAMEPARAM);
    console.log("bars response to posting appointment is " + JSON.stringify(barsResponse));
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
    console.log("posting appointment to BaRS failed");
    console.log(error.message);
    let response = {
      statusCode: 500,
      "headers": {
          "Content-Type": "application/json"
      },
      body: JSON.stringify({ "result": "posting appointment to BaRS failed", "message": error.message })
    }
    return response;
  }
}
