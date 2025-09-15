import { create_resource_pdm } from './create_resource_pdm_object.mjs';
import { update_resource_pdm } from './update_resource_pdm_object.mjs';
import { search_resource_pdm } from './search_resource_pdm_object.mjs';
import { delete_resource_pdm } from './delete_resource_pdm_object.mjs'
import { handler as processor } from './PDMResourceEventProcessor.mjs';
import { getParameterCaseInsensitive } from './api_common_functions.mjs';
import { snsCommonFunctionObject } from './sns_common_functions.mjs';

//const get_document_ref_object_instance = new get_document_ref_object();

const APIKEYSECRET = process.env['APIKEYSECRET'];
const APIENVIRONMENT = process.env['APIENVIRONMENT'];
const APIKNAMEPARAM = process.env['APIKNAMEPARAM'];
const NRLENABLED = (process.env['NRLENABLED'] != "false") ? true : false;
const PDMRESOURCETOPICARN = process.env['PDMRESOURCETOPICARN'];

export const handler = async (event) => {
  console.log(JSON.stringify(event));
    try {
        let fhirServerCreateHelperObject = new create_resource_pdm();
        let fhirServerUpdateHelperObject = new update_resource_pdm();
        let fhirServerSearchHelperObject = new search_resource_pdm();
        let fhirServerDeleteHelperObject = new delete_resource_pdm();
        let snsCommonFunctionObjectInstance = new snsCommonFunctionObject();
        return await processor(event, fhirServerCreateHelperObject, fhirServerUpdateHelperObject, fhirServerSearchHelperObject, fhirServerDeleteHelperObject, snsCommonFunctionObjectInstance, getParameterCaseInsensitive, APIENVIRONMENT, APIKEYSECRET, APIKNAMEPARAM, NRLENABLED, PDMRESOURCETOPICARN);
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
