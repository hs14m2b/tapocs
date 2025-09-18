// Filename: SendAIAgentMessageProcessor.mjs

export const handler = async (event, snsCommonFunctionObjectInstance, bedrockAgentClient, InvokeAgentCommand, jwt, uuidv4, getParameterCaseInsensitive, APIENVIRONMENT, APIKEYSECRET, APIKNAMEPARAM, AIAGENTMESSAGETOPIC) => {
  console.log(JSON.stringify(event));
  //POST handler with a JSON body
  try {
    //get the nhsnumber from the event.body which is x-www-form-urlencoded
    if (event.isBase64Encoded) {
      event.body = Buffer.from(event.body, 'base64').toString('utf8');
    }

    let identity_token = "";
    let id_token_nhsnumber = "";
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
      const decoded = jwt.decode(identity_token);
      console.log("decoded id_token is " + JSON.stringify(decoded));
      id_token_nhsnumber = decoded.nhs_number;
      console.log("nhsnumber is " + id_token_nhsnumber);

    } catch (error) {
      console.log("error getting identity_token from formdata cookie");
      console.log(error.message);
      identity_token = "";
    }
    let resourceJson = Object.fromEntries(new URLSearchParams(event.body));
    console.log("resourceJson is " + JSON.stringify(resourceJson));
    //expect the resourceJson to have a property message
    let message = resourceJson.message;
    let sessionId = (resourceJson.sessionId && resourceJson.sessionId !== "") ? resourceJson.sessionId : uuidv4();
    let sessionState = (resourceJson.sessionState && resourceJson.sessionState !== "") ? JSON.parse(resourceJson.sessionState) : { // SessionState
        sessionAttributes: { // SessionAttributesMap
          "nhsnumber": id_token_nhsnumber
        },
        promptSessionAttributes: { 
          "nhsnumber": id_token_nhsnumber
        }
      };
    console.log("message is " + message);
    console.log("sessionId is " + sessionId);
    let aiInput = { // InvokeAgentRequest
      sessionState: sessionState,
      agentId: "N8JM7Q8BTF", // required
      agentAliasId: "TSTALIASID", // required
      sessionId: sessionId,//uuidv4(), // required
      endSession: false,
      enableTrace: false,
      inputText: message
    };
    if (identity_token === "") {
      let aiAgentNoIDTokenResponse = {
        statusCode: 200,
        "headers": {
            "Content-Type": "application/json",
            "X-Response-Source": "AIAgent"
        },
        body: JSON.stringify({ "aiResponse": "Please log in using NHS login to start a conversation", "message": message, "sessionState": aiInput.sessionState })
      };
      console.log(JSON.stringify(aiAgentNoIDTokenResponse));
      return aiAgentNoIDTokenResponse;
    }

    console.log("input is " + JSON.stringify(aiInput, null, 2));
    const snsMessage = {
      "aiInput": aiInput,
      "messageUUID": uuidv4()
    };

    //publish to SNS topic
    console.log("publishing aiInput and messageUUID to SNS topic " + AIAGENTMESSAGETOPIC);
    try {
      await snsCommonFunctionObjectInstance.publishEvent(JSON.stringify(snsMessage), AIAGENTMESSAGETOPIC);
    } catch (error) {
      console.log("publishing event to SNS failed");
      console.log(error);
    }

    //return the messageUUID to the caller
    let messageUUIDResponse = {
      statusCode: 200,
      "headers": {
          "Content-Type": "application/json",
          "X-Response-Source": "AIAgent"
      },
      body: JSON.stringify({ "messageUUID": snsMessage.messageUUID, "message": message, "aiInput": aiInput })
    };
    console.log(JSON.stringify(messageUUIDResponse));
    return messageUUIDResponse;

    //const command = new InvokeAgentCommand(aiInput);
    let aiResponseText = "";
    try {
        const response = await bedrockAgentClient.send(command);

        // The response is streamed back via 'completion' events
        // The SDK gives you an async iterable over the stream
        for await (const event of response.completion) {
          if (event.chunk) {
            const chunk = Buffer.from(event.chunk.bytes).toString("utf8");
            console.log("Response chunk:", chunk);
            aiResponseText += chunk;
          }
        }
        console.log("response is " + JSON.stringify(response, null, 2));
      } catch (err) {
        console.error("Error invoking agent:", err);
      }

    //return the resource
    let aiAgentResponse = {
      statusCode: 200,
      "headers": {
          "Content-Type": "application/json",
          "X-Response-Source": "AIAgent"
      },
      body: JSON.stringify({ "aiResponse": aiResponseText, "message": message, "aiInput": aiInput })
    };
    console.log(JSON.stringify(aiAgentResponse));
    return aiAgentResponse;
  }
  catch (error) {
    console.log("Failed to interact with AI Agent");
    console.log(error.message);
    let response = {
      statusCode: 500,
      "headers": {
          "Content-Type": "application/json"
      },
      body: JSON.stringify({ "result": "Failed to interact with AI Agent", "message": error.message })
    }
    return response;
  }
}
