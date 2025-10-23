// Filename: CheckAIAgentResponseProcessor.mjs

export const handler = async (event, ddbCommonFunctionObjectInstance, getParameterCaseInsensitive, APIENVIRONMENT, APIKEYSECRET, APIKNAMEPARAM, AIAGENTRESPONSETABLE) => {
  console.log(JSON.stringify(event));
  //POST handler with a JSON body
  try {
    //get the messageuuid from the event.body which is x-www-form-urlencoded
    if (event.isBase64Encoded) {
      event.body = Buffer.from(event.body, 'base64').toString('utf8');
    }

    let messageuuid = "";
    let resourceJson = Object.fromEntries(new URLSearchParams(event.body));
    console.log("resourceJson is " + JSON.stringify(resourceJson));
    //expect the resourceJson to have a property messageuuid
    messageuuid = resourceJson.messageuuid;
    if (!messageuuid || messageuuid.trim().length == 0) {
      let response = {
        statusCode: 400,
        "headers": {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ "result": "messageuuid is required" })
      }
      return response;
    }

    let ddbResponse = {
      Item: {}
    };
    try {
      ddbResponse = await ddbCommonFunctionObjectInstance.getItemDDB({ "messageuuid": messageuuid }, AIAGENTRESPONSETABLE);
      console.log("DDB response is " + JSON.stringify(ddbResponse));
    } catch (error) {
      console.log("get item from DDB failed");
      console.log(error.message);
    }

    //return the resource
    let aiAgentResponse = {
      statusCode: 200,
      "headers": {
          "Content-Type": "application/json",
          "X-Response-Source": "AIAgent"
      },
      body: JSON.stringify(ddbResponse.Item)
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
