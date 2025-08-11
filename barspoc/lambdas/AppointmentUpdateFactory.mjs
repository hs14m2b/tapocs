import { create_resource_pdm } from './create_resource_pdm_object.mjs';
import { update_resource_pdm } from './update_resource_pdm_object.mjs';
import { search_resource_pdm } from './search_resource_pdm_object.mjs';
import { handler as processor } from './AppointmentUpdateProcessor.mjs';
import { getParameterCaseInsensitive } from './api_common_functions.mjs';
import { put_document_ref_bars } from './put_document_ref_bars_object.mjs';
import { get_document_ref_bars } from './get_document_ref_bars_object.mjs';
import { find_document_ref_bars } from './find_document_ref_bars_object.mjs';

//const get_document_ref_object_instance = new get_document_ref_object();

const APIKEYSECRET = process.env['APIKEYSECRET'];
const APIENVIRONMENT = process.env['APIENVIRONMENT'];
const APIKNAMEPARAM = process.env['APIKNAMEPARAM'];
const NRLENABLED = (process.env['NRLENABLED'] != "false") ? true : false;

export const handler = async (event) => {
  console.log(JSON.stringify(event));
    try {
        let fhirServerCreateHelperObject = new create_resource_pdm();
        let fhirServerUpdateHelperObject = new update_resource_pdm();
        let fhirServerSearchHelperObject = new search_resource_pdm();
        let putDocumentRefBarsObject = new put_document_ref_bars();
        let getDocumentRefBarsObject = new get_document_ref_bars();
        let findDocumentRefBarsObject = new find_document_ref_bars();
        return await processor(event, fhirServerCreateHelperObject, fhirServerUpdateHelperObject, fhirServerSearchHelperObject, putDocumentRefBarsObject, getDocumentRefBarsObject, findDocumentRefBarsObject, getParameterCaseInsensitive, APIENVIRONMENT, APIKEYSECRET, APIKNAMEPARAM, NRLENABLED);
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
