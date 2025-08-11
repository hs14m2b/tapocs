import { handler } from '../../lambdas/SlotSearchProcessor.mjs';
import { search_resource_healthlake } from './helpers/search_resource_healthlake_helper.mjs'
import { getParameterCaseInsensitive } from '../../lambdas/api_common_functions.mjs';
import { sendDocRef } from './helpers/post_document_ref_helper.mjs'
import { postResource } from './helpers/post_resource_healthlake_helper.mjs'
import { putResource } from './helpers/put_resource_healthlake_helper.mjs'
import mhdsbundle from './data/mhdsbundle.json' assert { type: "json" };
describe("Slot Query Processor", function() {
  process.env['APIENVIRONMENT'] = "int";
  process.env['APIKEYSECRET'] = "blah";
  process.env['APIKNAMEPARAM'] = "blah2";

  beforeEach(function() {
    console.log("do something before each test");
  });

  it("can process a simple search from healthlake", async function() {
    let event = {
      "queryStrings": {
        "qs1": "qsvalue1"
      },
      "headers": {
        "content-encoding": "NOTGZIP",
        "nhsd-end-user-organisation-ods": "X26"
      }
    };
    let hlr1 = { "body": JSON.stringify({ "entry": [{ "blah": "blaah1" }] }) };
    let search_resource_healthlake_instance = new search_resource_healthlake([], [hlr1]);
    console.log("helper object is " + JSON.stringify(search_resource_healthlake_instance));
    let response = await handler(event, search_resource_healthlake_instance, getParameterCaseInsensitive, process.env['APIKEYSECRET'], process.env['APIENVIRONMENT'], process.env['APIKNAMEPARAM']);
    console.log(JSON.stringify(response));
    expect(response.statusCode).toEqual(200);
  });

  it("returns 500 if searchFhirServer throws an error", async function() {
    let event = {
      "queryStrings": {
        "qs1": "qsvalue1"
      },
      "headers": {
        "content-encoding": "NOTGZIP",
        "nhsd-end-user-organisation-ods": "X26"
      }
    };
    let search_resource_healthlake_instance = {
      searchResourceWithRetry: jasmine.createSpy("searchResourceWithRetry").and.throwError("search error")
    };
    let search_nrl_instance = {
      searchDocRef: jasmine.createSpy("searchDocRef").and.throwError("search error")
    };
    let response = await handler(event, search_resource_healthlake_instance, getParameterCaseInsensitive, search_nrl_instance.searchDocRef,  process.env['APIKEYSECRET'], process.env['APIENVIRONMENT'], process.env['APIKNAMEPARAM']);
    expect(response.statusCode).toEqual(500);
    expect(JSON.parse(response.body).result).toEqual("searchFhirServer failed");
  });

  it("returns 500 if an unexpected error occurs", async function() {
    let event = {
      "queryStrings": {
        "qs1": "qsvalue1"
      },
      "headers": {
        "content-encoding": "NOTGZIP",
        "nhsd-end-user-organisation-ods": "X26"
      }
    };
    let search_resource_healthlake_instance = {
      searchResourceWithRetry: jasmine.createSpy("searchResourceWithRetry").and.returnValue(Promise.reject(new Error("unexpected error")))
    };
    let search_nrl_instance = {
      searchDocRef: jasmine.createSpy("searchDocRef").and.returnValue(false)
    };
    let response = await handler(event, search_resource_healthlake_instance, getParameterCaseInsensitive, search_nrl_instance.searchDocRef,  process.env['APIKEYSECRET'], process.env['APIENVIRONMENT'], process.env['APIKNAMEPARAM']);
    expect(response.statusCode).toEqual(500);
    expect(JSON.parse(response.body).result).toEqual("searchFhirServer failed");
  });
});
 
