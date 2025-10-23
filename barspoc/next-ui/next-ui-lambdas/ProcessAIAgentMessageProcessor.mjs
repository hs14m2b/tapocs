// Filename: ProcessAIAgentMessageProcessor.mjs

export const handler = async (event, bedrockAgentClient, InvokeAgentCommand, ddbCommonFunctionObjectInstance, jwt, uuidv4, getParameterCaseInsensitive, APIENVIRONMENT, APIKEYSECRET, APIKNAMEPARAM, AIAGENTMESSAGETOPIC, AIAGENTRESPONSETABLE) => {
  console.log(JSON.stringify(event));
  let messageJson;
  try {
    for (let record of event.Records) {
      let messageString = record.Sns.Message;
      messageJson = JSON.parse(messageString);
      console.log("Message is " + JSON.stringify(messageJson));
    }
  } catch (error) {
    console.log("Error processing SNS event");
    console.log(error);
  }

  try {

    let aiInput = messageJson.aiInput;
    let messageUUID = messageJson.messageUUID;
    console.log("input is " + JSON.stringify(aiInput, null, 2));

    //Invoke the agent
    const command = new InvokeAgentCommand(aiInput);
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
          if (event.trace) {
            console.log("Response trace:", JSON.stringify(event.trace, null, 2));
          }
        }
        console.log("response is " + JSON.stringify(response, null, 2));
      } catch (err) {
        console.error("Error invoking agent:", err);
      }

    //post the response to a DDB table for retrieval by the front end
    let message = {
      "messageuuid": messageUUID,
      "aiResponse": aiResponseText,
      "aiInput": aiInput,
      "valid_until": parseInt((Date.now() / 1000).toString()) + 3600 * 24 //24 hours from now
    };
    console.log("message to put in DDB is " + JSON.stringify(message, null, 2));

    try {
      let response = await ddbCommonFunctionObjectInstance.putItemDDB(message, AIAGENTRESPONSETABLE);
    } catch (error) {
      console.log("Error putting item in DDB:", error);
    }

    return;
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
