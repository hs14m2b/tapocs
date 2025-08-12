import { handler } from '../../lambdas/ServiceRequestCreateProcessor.mjs';
import { create_resource_fhir } from './helpers/create_resource_fhir_helper.mjs'
import { update_resource_healthlake } from './helpers/update_resource_healthlake_helper.mjs'
import { post_document_ref_bars_helper } from './helpers/post_document_ref_bars_helper.mjs';
import { getParameterCaseInsensitive } from '../../lambdas/api_common_functions.mjs';
import { sendDocRef } from './helpers/post_document_ref_helper.mjs'
import { postResource } from './helpers/post_resource_healthlake_helper.mjs'
import { putResource } from './helpers/put_resource_healthlake_helper.mjs'
import serviceRequest from './data/serviceRequest.json' with { type: "json" };
import processMessageBundle from './data/serviceRequestBundle.json' with { type: "json" };
describe("ServiceRequest Create Processor", function() {
  process.env['APIENVIRONMENT'] = "int";
  process.env['APIKEYSECRET'] = "blah";
  process.env['APIKNAMEPARAM'] = "blah2";

  beforeEach(function() {
    console.log("do something before each test");
  });

  it("can create a service request", async function() {
    let event = {
      "headers": {
        "content-encoding": "NOTGZIP",
        "nhsd-end-user-organisation-ods": "X26",
        "x-request-id": "123456789"
      },
      body: JSON.stringify(processMessageBundle)
    };
    let hlr1 = { "body": JSON.stringify(serviceRequest) };
    let create_resource_fhir_instance = new create_resource_fhir([serviceRequest], []);
    let update_resource_healthlake_instance = new update_resource_healthlake([serviceRequest], []);
    console.log("helper object is " + JSON.stringify(create_resource_fhir_instance));
    let response = await handler(event, create_resource_fhir_instance, update_resource_healthlake_instance, getParameterCaseInsensitive, process.env['APIKEYSECRET'], process.env['APIENVIRONMENT'], process.env['APIKNAMEPARAM'], true);
    console.log(JSON.stringify(response));
    expect(response.statusCode).toEqual(201);
  });

  it("returns 500 if createResource throws an error", async function() {
    let event = {
      "headers": {
        "content-encoding": "NOTGZIP",
        "nhsd-end-user-organisation-ods": "X26",
        "x-request-id": "123456789"
      },
      body: JSON.stringify(processMessageBundle)
    };
    let create_resource_healthlake_instance = {
      createResource: jasmine.createSpy("createResource").and.throwError("search error")
    };
    let update_resource_healthlake_instance = new update_resource_healthlake([serviceRequest], []);
    let response = await handler(event, create_resource_healthlake_instance, update_resource_healthlake_instance, getParameterCaseInsensitive,  process.env['APIKEYSECRET'], process.env['APIENVIRONMENT'], process.env['APIKNAMEPARAM'], true);
    expect(response.statusCode).toEqual(500);
    expect(JSON.parse(response.body).result).toEqual("createFhirServer failed");
  });

});
 
