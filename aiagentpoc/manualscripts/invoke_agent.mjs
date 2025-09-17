import { BedrockAgentRuntimeClient, InvokeAgentCommand } from "@aws-sdk/client-bedrock-agent-runtime"; // ES Modules import
const REGION = "eu-west-2";
const client = new BedrockAgentRuntimeClient({ region: REGION });
const { v4: uuidv4 } = await import('uuid');

const input = { // InvokeAgentRequest
  sessionState: { // SessionState
    sessionAttributes: { // SessionAttributesMap
      "nhsnumber": "9661034524",
    },
    promptSessionAttributes: { 
      "nhsnumber": "9661034524",
    }
  },
  agentId: "N8JM7Q8BTF", // required
  agentAliasId: "TSTALIASID", // required
  sessionId: uuidv4(), // required
  endSession: false,
  enableTrace: false,
  inputText: "Hello, what is my next NHS appointment?"
};
console.log("input is " + JSON.stringify(input, null, 2));
const command = new InvokeAgentCommand(input);
try {
    const response = await client.send(command);

    // The response is streamed back via 'completion' events
    // The SDK gives you an async iterable over the stream
    for await (const event of response.completion) {
      if (event.chunk) {
        const chunk = Buffer.from(event.chunk.bytes).toString("utf8");
        console.log("Response chunk:", chunk);
      }
    }
    console.log("response is " + JSON.stringify(response, null, 2));
  } catch (err) {
    console.error("Error invoking agent:", err);
  }
