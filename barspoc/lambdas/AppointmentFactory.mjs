import { search_resource_pdm } from './search_resource_pdm_object.mjs';
import { handler as processor } from './AppointmentProcessor.mjs';
import { getParameterCaseInsensitive } from './api_common_functions.mjs';

//const get_document_ref_object_instance = new get_document_ref_object();

const APIKEYSECRET = process.env['APIKEYSECRET'];
const APIENVIRONMENT = process.env['APIENVIRONMENT'];
const APIKNAMEPARAM = process.env['APIKNAMEPARAM'];

export const handler = async (event) => {
  console.log(JSON.stringify(event));
    try {
        let fhirSearchHelperObject = new search_resource_pdm();
        return await processor(event, fhirSearchHelperObject, getParameterCaseInsensitive, APIENVIRONMENT, APIKEYSECRET, APIKNAMEPARAM)
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
