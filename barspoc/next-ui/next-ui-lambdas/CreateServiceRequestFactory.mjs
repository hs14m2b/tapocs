import { handler as processor } from './CreateServiceRequestProcessor.mjs';
import { getParameterCaseInsensitive } from './api_common_functions.mjs';
import { post_servicerequest_bars } from './post_servicerequest_bars_object.mjs';
import { v4 as uuidv4 } from 'uuid';
import processMessage from './serviceRequestBundle.json' with { type: 'json' };

//const get_document_ref_object_instance = new get_document_ref_object();

const APIKEYSECRET = process.env['APIKEYSECRET'];
const APIENVIRONMENT = process.env['APIENVIRONMENT'];
const APIKNAMEPARAM = process.env['APIKNAMEPARAM'];

export const handler = async (event) => {
  console.log(JSON.stringify(event));
    try {
        let postServiceRequestBarsObject = new post_servicerequest_bars();
        return await processor(event, postServiceRequestBarsObject, getParameterCaseInsensitive, APIENVIRONMENT, APIKEYSECRET, APIKNAMEPARAM, processMessage);
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
