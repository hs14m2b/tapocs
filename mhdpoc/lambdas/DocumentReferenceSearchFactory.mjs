import { search_resource_healthlake } from './search_resource_healthlake_object.mjs';
import { handler as processor } from './DocumentReferenceSearchProcessor.mjs';
import { getParameterCaseInsensitive } from './api_common_functions.mjs';
import { searchDocRef } from "./search_document_ref_nrl.mjs";



const APIKEYSECRET = process.env['APIKEYSECRET'];
const APIENVIRONMENT = process.env['APIENVIRONMENT'];
const APIKNAMEPARAM = process.env['APIKNAMEPARAM'];





export const handler = async (event) => {
  console.log(JSON.stringify(event));
    try {
      let healthlakeSearchHelperObject = new search_resource_healthlake();
      return await processor(event, healthlakeSearchHelperObject, getParameterCaseInsensitive, searchDocRef, APIKEYSECRET, APIENVIRONMENT, APIKNAMEPARAM);
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