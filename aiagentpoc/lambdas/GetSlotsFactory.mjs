import { handler as processor } from './GetSlotsProcessor.mjs';
import { getParameterCaseInsensitive } from './api_common_functions.mjs';
import { find_slots_bars } from './find_slots_bars_object.mjs';

//const get_document_ref_object_instance = new get_document_ref_object();

const APIKEYSECRET = process.env['APIKEYSECRET'];
const APIENVIRONMENT = process.env['APIENVIRONMENT'];
const APIKNAMEPARAM = process.env['APIKNAMEPARAM'];

export const handler = async (event) => {
  console.log(JSON.stringify(event));
    try {
        let findSlotsBarsObject = new find_slots_bars();
        return await processor(event, findSlotsBarsObject, getParameterCaseInsensitive, APIENVIRONMENT, APIKEYSECRET, APIKNAMEPARAM)
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
