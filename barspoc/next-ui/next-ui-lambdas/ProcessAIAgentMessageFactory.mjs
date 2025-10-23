import { handler as processor } from './ProcessAIAgentMessageProcessor.mjs';
import { getParameterCaseInsensitive } from './api_common_functions.mjs';
import { ddbCommonFunctionObject } from './ddb_common_functions.mjs';
import { BedrockAgentRuntimeClient, InvokeAgentCommand } from "@aws-sdk/client-bedrock-agent-runtime"; // ES Modules import
const REGION = "eu-west-2";
const bedrockAgentClient = new BedrockAgentRuntimeClient({ region: REGION });
const { v4: uuidv4 } = await import('uuid');
import jwt from 'jsonwebtoken';

const { verify } = jwt;

const APIKEYSECRET = process.env['APIKEYSECRET'];
const APIENVIRONMENT = process.env['APIENVIRONMENT'];
const APIKNAMEPARAM = process.env['APIKNAMEPARAM'];
const AIAGENTMESSAGETOPIC = process.env['AIAGENTMESSAGETOPIC'];
const AIAGENTRESPONSETABLE = process.env['AIAGENTRESPONSETABLE'];

export const handler = async (event) => {
  console.log(JSON.stringify(event));
    try {
        const ddbCommonFunctionObjectInstance = new ddbCommonFunctionObject();
        return await processor(event, bedrockAgentClient, InvokeAgentCommand, ddbCommonFunctionObjectInstance, jwt, uuidv4, getParameterCaseInsensitive, APIENVIRONMENT, APIKEYSECRET, APIKNAMEPARAM, AIAGENTMESSAGETOPIC, AIAGENTRESPONSETABLE);
    } catch (error) {
        console.log("caught error " + error.message);
        let response = {
            statusCode: 500,
            "headers": {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ "result": error.message })
        }
        return response;
    }
}
