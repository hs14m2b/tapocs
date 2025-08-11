import { create_resource_pdm } from './create_resource_pdm_object.mjs';
import { update_resource_pdm } from './update_resource_pdm_object.mjs';
import { handler as processor } from './AppointmentCreateProcessor.mjs';
import { getParameterCaseInsensitive } from './api_common_functions.mjs';
import { post_document_ref_nrl } from './post_document_ref_nrl_object.mjs';
import { post_document_ref_pdm } from './post_document_ref_pdm_object.mjs';

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
        let postDocumentRefBarsObject = new post_document_ref_nrl();
        let postDocumentRefPDMObject = new post_document_ref_pdm();
        return await processor(event, fhirServerCreateHelperObject, fhirServerUpdateHelperObject, postDocumentRefBarsObject, postDocumentRefPDMObject, getParameterCaseInsensitive, APIENVIRONMENT, APIKEYSECRET, APIKNAMEPARAM, NRLENABLED)
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
