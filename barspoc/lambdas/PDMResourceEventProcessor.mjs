// Filename: PDMResourceEventProcessor.mjs
import { v4 as uuidv4 } from 'uuid';

export const handler = async (event, fhirCreateHelper, fhirUpdateHelper, fhirSearchHelper, fhirDeleteHelper, snsCommonFunctionObjectInstance, getParameterCaseInsensitive, APIENVIRONMENT, APIKEYSECRET, APIKNAMEPARAM, PDMRESOURCETOPICARN) => {
  console.log(JSON.stringify(event));
  let responseMessage = {
    successMessages: [],
    errorMessages: []
  }
  try {
    for (let record of event.Records) {
      let messageId = record.Sns.MessageId;
      console.log("Processing SNS message with ID: " + messageId);
      //the message is expected to be a JSON string
      let messageString = record.Sns.Message;
      let messageJson = JSON.parse(messageString);
      console.log("Message is " + JSON.stringify(messageJson));
      //messageJson should contain a resource, resourceType and action (Create, Update, Delete)
      //check that messageJson is well-formed
      if (messageJson && messageJson.resource && messageJson.resourceType && messageJson.action) {
        console.log("messageJson is well-formed");
      } else {
        console.log("messageJson is NOT well-formed");
        throw new Error("messageJson is not well-formed");
      }
      //check that the action is one we support
      if (["Create", "Update", "Delete"].includes(messageJson.action)) {
        console.log("messageJson action is supported: " + messageJson.action);
      } else {
        console.log("messageJson action is NOT supported: " + messageJson.action);
        responseMessage.errorMessages.push(messageId);
        continue; //skip to next record
      }
      //process the action
      let resourceJson = messageJson.resource;
      let resourceType = messageJson.resourceType;
      let action = messageJson.action;
      let headersJson = {"X-Request-ID": uuidv4()};
      let fhirResponse;
      if (action === "Create") {
        console.log("Creating resource in FHIR Server");
        fhirResponse = await fhirCreateHelper.createResource(resourceJson, resourceType, headersJson, APIENVIRONMENT, APIKEYSECRET, APIKNAMEPARAM);
      } else if (action === "Update") {
        console.log("Updating resource in FHIR Server");
        fhirResponse = await fhirUpdateHelper.updateResource(resourceJson, resourceType, headersJson, APIENVIRONMENT, APIKEYSECRET, APIKNAMEPARAM);
      } else if (action === "Delete") {
        console.log("Deleting resource in FHIR Server");
        fhirResponse = await fhirDeleteHelper.deleteResource(resourceJson.id, resourceType, headersJson, APIENVIRONMENT, APIKEYSECRET, APIKNAMEPARAM);
      }
      console.log("FHIR Server response: " + JSON.stringify(fhirResponse));
      if (!fhirResponse || (fhirResponse.resourceType === "OperationOutcome" && fhirResponse.issue && fhirResponse.issue[0] && fhirResponse.issue[0].severity === "error")) {
        console.log("FHIR Server response indicates an error");
        responseMessage.errorMessages.push(messageId);
      }
      else {
        console.log("FHIR Server response indicates success");
        responseMessage.successMessages.push(messageId);
      }
    }
  } catch (error) {
    console.log("Error processing SNS event");
    console.log(error);
  }
  return responseMessage;
}

