import { handler as processor } from './GetServiceRequestProcessor.mjs';
import { getParameterCaseInsensitive } from './api_common_functions.mjs';
import { find_servicerequest_bars } from './find_servicerequest_bars_object.mjs';
import { get_servicerequest_bars } from './get_servicerequest_bars_object.mjs';

//const get_document_ref_object_instance = new get_document_ref_object();

const APIKEYSECRET = process.env['APIKEYSECRET'];
const APIENVIRONMENT = process.env['APIENVIRONMENT'];
const APIKNAMEPARAM = process.env['APIKNAMEPARAM'];
const NRLENABLED = (process.env['NRLENABLED'] != "false") ? true : false;

export const handler = async (event) => {
  console.log(JSON.stringify(event));
    try {
        let getServiceRequestBarsObject = new get_servicerequest_bars();
        return await processor(event, getServiceRequestBarsObject, getParameterCaseInsensitive, APIENVIRONMENT, APIKEYSECRET, APIKNAMEPARAM, NRLENABLED)
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
