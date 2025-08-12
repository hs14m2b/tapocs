import { handler as processor } from './DefaultRouteProcessor.mjs';

import { create_resource_pdm } from './create_resource_pdm_object.mjs';
import { update_resource_pdm } from './update_resource_pdm_object.mjs';
import { handler as servicerequestprocessor } from './ServiceRequestCreateProcessor.mjs';
import { getParameterCaseInsensitive } from './api_common_functions.mjs';

//const get_document_ref_object_instance = new get_document_ref_object();

const APIKEYSECRET = process.env['APIKEYSECRET'];
const APIENVIRONMENT = process.env['APIENVIRONMENT'];
const APIKNAMEPARAM = process.env['APIKNAMEPARAM'];
const NRLENABLED = (process.env['NRLENABLED'] != "false") ? true : false;


export const handler = async (event) => {
  console.log(JSON.stringify(event));
    try {
        if (event.rawPath.toUpperCase() === "/BARSPOC/FHIR/R4/$PROCESS-MESSAGE") {
            console.log("Processing /barspoc/FHIR/R4/$process-message route");
            let fhirServerCreateHelperObject = new create_resource_pdm();
            let fhirServerUpdateHelperObject = new update_resource_pdm();
            //TODO: inspect the message header to determine the transaction type
            //get the posted resource
            if (event.isBase64Encoded) {
                event.body = Buffer.from(event.body, 'base64').toString('utf8');
                event.isBase64Encoded = false;
            }
            let resourceJson = JSON.parse(event.body);
            let messageHeaderResource = resourceJson.entry.find(k => k.resource && k.resource.resourceType === "MessageHeader");
            if (messageHeaderResource) {
                console.log("MessageHeader found in the request");
                let messageHeader = messageHeaderResource.resource;
                if (messageHeader.eventCoding && messageHeader.eventCoding.code) {
                    console.log("Event Coding found: " + messageHeader.eventCoding.code);   
                    if (messageHeader.eventCoding.code === "servicerequest-request") {
                        return await servicerequestprocessor(event, fhirServerCreateHelperObject, fhirServerUpdateHelperObject, getParameterCaseInsensitive, APIENVIRONMENT, APIKEYSECRET, APIKNAMEPARAM, NRLENABLED);
                    }
                }
            }
        }
        return await processor(event);
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
