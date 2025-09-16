import { handler as processor } from './GetAppointmentsProcessor.mjs';
import { getParameterCaseInsensitive } from './api_common_functions.mjs';
import { find_document_ref_bars } from './find_document_ref_bars_object.mjs';
import { find_document_ref_pdm } from './find_document_ref_pdm_object.mjs';

//const get_document_ref_object_instance = new get_document_ref_object();

const APIKEYSECRET = process.env['APIKEYSECRET'];
const APIENVIRONMENT = process.env['APIENVIRONMENT'];
const APIKNAMEPARAM = process.env['APIKNAMEPARAM'];
const NRLENABLED = (process.env['NRLENABLED'] != "false") ? true : false;

export const handler = async (event) => {
  console.log(JSON.stringify(event));
    try {
        let findDocumentRefBarsObject = new find_document_ref_bars();
        let findDocumentRefPDMObject = new find_document_ref_pdm();
        return await processor(event, findDocumentRefBarsObject, findDocumentRefPDMObject, getParameterCaseInsensitive, APIENVIRONMENT, APIKEYSECRET, APIKNAMEPARAM, NRLENABLED)
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
