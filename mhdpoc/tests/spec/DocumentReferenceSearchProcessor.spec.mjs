import { handler } from '../../lambdas/DocumentReferenceSearchProcessor.mjs';
import { search_resource_healthlake } from './helpers/search_resource_healthlake_helper.mjs'
import { searchDocRef } from './helpers/search_document_ref_nrl_helper.mjs'
import { getParameterCaseInsensitive } from '../../lambdas/api_common_functions.mjs';
import { sendDocRef } from './helpers/post_document_ref_helper.mjs'
import { postResource } from './helpers/post_resource_healthlake_helper.mjs'
import { putResource } from './helpers/put_resource_healthlake_helper.mjs'
import mhdsbundle from './data/mhdsbundle.json' assert { type: "json" };
/*
describe("DocumentReference Search Processor", function() {
    process.env['APIENVIRONMENT'] = "sandpit";
    process.env['APIKEYSECRET'] = "blah";
    process.env['APIKNAMEPARAM'] = "blah2";

    beforeEach(function() {
		console.log("do something before each test");
    });

	it ("can process a simple search", async function(){
    let event = {
      "queryStrings": {
        "qs1": "qsvalue1"
      },
      "headers": {
        "content-encoding" : "NOTGZIP"
      }
    }
    let hlr1 = {"body": JSON.stringify({"entry": [{"blah": "blaah1"}]})}
    let search_resource_healthlake_instance = new search_resource_healthlake([], [hlr1]);
    console.log("helper object is " + JSON.stringify(search_resource_healthlake_instance));
    let response = await handler(event, search_resource_healthlake_instance);
    console.log(JSON.stringify(response));
		expect(response.statusCode).toEqual(200);
	});
});
*/
describe("DocumentReference Search Processor", function() {
  process.env['APIENVIRONMENT'] = "sandpit";
  process.env['APIKEYSECRET'] = "blah";
  process.env['APIKNAMEPARAM'] = "blah2";

  beforeEach(function() {
    console.log("do something before each test");
  });

  it("can process a simple search", async function() {
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
    let response = await handler(event, search_resource_healthlake_instance, getParameterCaseInsensitive, searchDocRef, process.env['APIKEYSECRET'], process.env['APIENVIRONMENT'], process.env['APIKNAMEPARAM']);
    console.log(JSON.stringify(response));
    expect(response.statusCode).toEqual(200);
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
    let search_nrl_instance = {
      searchDocRef: jasmine.createSpy("searchDocRef").and.returnValue(false)
    };
    console.log("helper object is " + JSON.stringify(search_resource_healthlake_instance));
    let response = await handler(event, search_resource_healthlake_instance, getParameterCaseInsensitive, search_nrl_instance.searchDocRef, process.env['APIKEYSECRET'], process.env['APIENVIRONMENT'], process.env['APIKNAMEPARAM']);
    console.log(JSON.stringify(response));
    expect(response.statusCode).toEqual(200);
  });

  it("returns 500 if searchHealthlake throws an error", async function() {
    let event = {
      "queryStrings": {
        "qs1": "qsvalue1"
      },
      "headers": {
        "content-encoding": "NOTGZIP",
        "nhsd-end-user-organisation-ods": "X26"
      }
    };
    console.log("got here 1");
    let search_resource_healthlake_instance = {
      searchResourceWithRetry: jasmine.createSpy("searchResourceWithRetry").and.throwError("search error")
    };
    console.log("got here 2");
    let search_nrl_instance = {
      searchDocRef: jasmine.createSpy("searchDocRef").and.throwError("search error")
    };
    console.log("got here 3");
    let response = await handler(event, search_resource_healthlake_instance, getParameterCaseInsensitive, search_nrl_instance.searchDocRef,  process.env['APIKEYSECRET'], process.env['APIENVIRONMENT'], process.env['APIKNAMEPARAM']);
    expect(response.statusCode).toEqual(500);
    expect(JSON.parse(response.body).result).toEqual("searchHealthlake failed");
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
    expect(JSON.parse(response.body).result).toEqual("searchHealthlake failed");
  });
});
