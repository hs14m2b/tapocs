import { handler } from '../../lambdas/DocumentReferenceProcessor.mjs';
import { get_document_ref_object } from './helpers/get_document_ref_helper.mjs'
import { getParameterCaseInsensitive } from '../../lambdas/api_common_functions.mjs';

describe("DocumentReference Processor", function() {
    process.env['APIENVIRONMENT'] = "sandpit";
    process.env['APIKEYSECRET'] = "blah";
    process.env['APIKNAMEPARAM'] = "blah2";

    beforeEach(function() {
		console.log("do something before each test");
    });

	it ("can process a simple search", async function(){
    let event = {
      "pathParameters": {
        "documentid": "docidvalue1"
      },
      "headers": {
        "content-encoding" : "NOTGZIP"
      }
    }
    let nrlr1 = {"body": JSON.stringify({"entry": [{"blah": "blaah1"}]})}
    let get_document_ref_object_instance = new get_document_ref_object( [nrlr1]);
    console.log("helper object is " + JSON.stringify(get_document_ref_object_instance));
    let response = await handler(event, get_document_ref_object_instance, getParameterCaseInsensitive, process.env['APIENVIRONMENT'],process.env['APIKEYSECRET'], process.env['APIKNAMEPARAM'] );
    console.log(JSON.stringify(response));
		expect(response.statusCode).toEqual(200);
	});

});
