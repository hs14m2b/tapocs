import { handler as processor } from './CheckAIAgentResponseProcessor.mjs';
import { getParameterCaseInsensitive } from './api_common_functions.mjs';
import { ddbCommonFunctionObject } from './ddb_common_functions.mjs';

const REGION = "eu-west-2";

const APIKEYSECRET = process.env['APIKEYSECRET'];
const APIENVIRONMENT = process.env['APIENVIRONMENT'];
const APIKNAMEPARAM = process.env['APIKNAMEPARAM'];
const AIAGENTRESPONSETABLE = process.env['AIAGENTRESPONSETABLE'];

export const handler = async (event) => {
  console.log(JSON.stringify(event));
    try {
        let ddbCommonFunctionObjectInstance = new ddbCommonFunctionObject();
        return await processor(event, ddbCommonFunctionObjectInstance, getParameterCaseInsensitive, APIENVIRONMENT, APIKEYSECRET, APIKNAMEPARAM, AIAGENTRESPONSETABLE);
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
