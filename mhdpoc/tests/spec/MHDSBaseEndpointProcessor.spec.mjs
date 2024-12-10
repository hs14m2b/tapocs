import { handler } from '../../lambdas/MHDSBaseEndpointProcessor.mjs';
import { readFileSync } from 'fs';
import { sendDocRef } from './helpers/post_document_ref_helper.mjs'
import { postResource } from './helpers/post_resource_healthlake_helper.mjs'
import { putResource } from './helpers/put_resource_healthlake_helper.mjs'
import mhdsbundle from './data/mhdsbundle.json' assert { type: "json" };

describe("MHDS Base Endpoint Processor", function() {
    process.env['APIENVIRONMENT'] = "sandpit";
    process.env['APIKEYSECRET'] = "blah";
    process.env['APIKNAMEPARAM'] = "blah2";

    beforeEach(function() {
		console.log("do something before each test");
    });

	it ("can process a simple bundle", async function(){
    let event = {
      "headers": {
        "content-encoding" : "NOTGZIP"
      },
      "isBase64Encoded": false,
      "body": JSON.stringify(mhdsbundle)
    }
    let response = await handler(event, sendDocRef, postResource, putResource, null, "sandpit", "blah", "blah2");
    console.log(JSON.stringify(response));
		expect(response.statusCode).toEqual(200);
	});

});
