import { sendDocRef } from './post_document_ref.mjs';
import { postResource } from './post_resource_pdm.mjs'
import { putResource } from './put_resource_pdm.mjs'
import { gunzipSync } from 'zlib';
import { handler as processor} from './MHDSBaseEndpointProcessor.mjs';

const APIENVIRONMENT = process.env['APIENVIRONMENT'];
const APIKEYSECRET = process.env['APIKEYSECRET'];
const APIKNAMEPARAM = process.env['APIKNAMEPARAM'];

// entry point for the lambda handler
export const handler = async (event) => {
  console.log(JSON.stringify(event));
  console.log("invoking processor");
  try {
    return await processor(event, sendDocRef, postResource, putResource, gunzipSync, APIENVIRONMENT, APIKEYSECRET, APIKNAMEPARAM);
  } catch (error) {
    console.log("caught unexpected error processing the request; " + error.message);
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

