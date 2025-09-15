import { handler } from '../../lambdas/AppointmentCreateProcessor.mjs';
import { create_resource_fhir } from './helpers/create_resource_fhir_helper.mjs'
import { update_resource_healthlake } from './helpers/update_resource_healthlake_helper.mjs'
import { post_document_ref_bars_helper } from './helpers/post_document_ref_bars_helper.mjs';
import { search_resource_pdm } from './helpers/search_resource_pdm_helper.mjs';
import { getParameterCaseInsensitive } from '../../lambdas/api_common_functions.mjs';
import { sendDocRef } from './helpers/post_document_ref_helper.mjs'
import { postResource } from './helpers/post_resource_healthlake_helper.mjs'
import { putResource } from './helpers/put_resource_healthlake_helper.mjs'
import mhdsbundle from './data/mhdsbundle.json' with { type: "json" };
import appointment from './data/appointment-002.json' with { type: "json" };
import servicerequest from './data/serviceRequest-002.json' with { type: "json" };
import task from './data/task-002.json' with { type: "json" };

describe("Appointment Create Processor", function() {
  process.env['APIENVIRONMENT'] = "int";
  process.env['APIKEYSECRET'] = "blah";
  process.env['APIKNAMEPARAM'] = "blah2";

  beforeEach(function() {
    console.log("do something before each test");
  });

  it("can create an appointment", async function() {
    let event = {
      "headers": {
        "content-encoding": "NOTGZIP",
        "nhsd-end-user-organisation-ods": "X26",
        "x-request-id": "123456789"
      },
      body: JSON.stringify(appointment)
    };
    let hlr1 = { "body": JSON.stringify(appointment) };
    let create_resource_fhir_instance = new create_resource_fhir([appointment], []);
    let update_resource_healthlake_instance = new update_resource_healthlake([appointment, servicerequest, task], []);
    let serviceRequestSearch = {
      status: 200,
      body:JSON.stringify({
        resourceType: "Bundle",
        type: "searchset",
        total: 1,
        entry: [ 
          { resource: servicerequest}
        ]
      })
    }
    let taskRequestSearch = {
      status: 200,
      body:JSON.stringify({
        resourceType: "Bundle",
        type: "searchset",
        total: 1,
        entry: [ 
          { resource: task}
        ]
      })
    };
    let search_resource_pdm_instance = new search_resource_pdm([serviceRequestSearch, taskRequestSearch], []);
    let docrefresp1 = { "headers": { "status": 201, "Location": "https://some.server.nhs.uk/fhir/r4/DocumentReference/id12345"}, "body": { "resourceType": "DocumentReference"}}
    let post_document_ref_bars_helper_instance = new post_document_ref_bars_helper([docrefresp1, docrefresp1], []);
    console.log("helper object is " + JSON.stringify(create_resource_fhir_instance));
    let response = await handler(event, create_resource_fhir_instance, update_resource_healthlake_instance, 
      post_document_ref_bars_helper_instance, post_document_ref_bars_helper_instance, 
      search_resource_pdm_instance, getParameterCaseInsensitive, 
      process.env['APIKEYSECRET'], process.env['APIENVIRONMENT'], 
      process.env['APIKNAMEPARAM'], true);
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
      body: JSON.stringify(appointment)
    };
    let create_resource_healthlake_instance = {
      createResource: jasmine.createSpy("createResource").and.throwError("search error")
    };
    let serviceRequestSearch = {
      status: 200,
      body:JSON.stringify({
        resourceType: "Bundle",
        type: "searchset",
        total: 1,
        entry: [ 
          { resource: servicerequest}
        ]
      })
    }
    let taskRequestSearch = {
      status: 200,
      body:JSON.stringify({
        resourceType: "Bundle",
        type: "searchset",
        total: 1,
        entry: [ 
          { resource: task}
        ]
      })
    };
    let search_resource_pdm_instance = new search_resource_pdm([serviceRequestSearch, taskRequestSearch], []);
    let update_resource_healthlake_instance = new update_resource_healthlake([appointment], []);
    let docrefresp1 = { "headers": { "status": 201, "Location": "https://some.server.nhs.uk/fhir/r4/DocumentReference/id12345"}, "body": { "resourceType": "DocumentReference"}}
    let post_document_ref_bars_helper_instance = new post_document_ref_bars_helper([docrefresp1, docrefresp1], []);
    let response = await handler(event, create_resource_healthlake_instance, update_resource_healthlake_instance, 
      post_document_ref_bars_helper_instance, post_document_ref_bars_helper_instance, 
      search_resource_pdm_instance, getParameterCaseInsensitive, 
      process.env['APIKEYSECRET'], process.env['APIENVIRONMENT'], 
      process.env['APIKNAMEPARAM'], true);
    expect(response.statusCode).toEqual(500);
    expect(JSON.parse(response.body).result).toEqual("createFhirServer failed");
  });

  it("returns 201 if sendDocRef throws an error", async function() {
    let event = {
      "headers": {
        "content-encoding": "NOTGZIP",
        "nhsd-end-user-organisation-ods": "X26",
        "x-request-id": "123456789"
      },
      body: JSON.stringify(appointment)
    };
    let post_document_ref_bars_helper_instance = {
      sendDocRef: jasmine.createSpy("sendDocRef").and.throwError("create error")
    };
    let serviceRequestSearch = {
      status: 200,
      body:JSON.stringify({
        resourceType: "Bundle",
        type: "searchset",
        total: 1,
        entry: [ 
          { resource: servicerequest}
        ]
      })
    }
    let taskRequestSearch = {
      status: 200,
      body:JSON.stringify({
        resourceType: "Bundle",
        type: "searchset",
        total: 1,
        entry: [ 
          { resource: task}
        ]
      })
    };
    let search_resource_pdm_instance = new search_resource_pdm([serviceRequestSearch, taskRequestSearch], []);
    let create_resource_healthlake_instance = new create_resource_fhir([appointment], []);
    let update_resource_healthlake_instance = new update_resource_healthlake([appointment], []);
    let response = await handler(event, create_resource_healthlake_instance, update_resource_healthlake_instance, post_document_ref_bars_helper_instance, post_document_ref_bars_helper_instance, search_resource_pdm_instance, getParameterCaseInsensitive,  process.env['APIKEYSECRET'], process.env['APIENVIRONMENT'], process.env['APIKNAMEPARAM'], true);
    expect(response.statusCode).toEqual(201);
  });

  it("returns 500 if an unexpected error occurs", async function() {
    let event = {
      "pathParameters": {
        "appointmentId": "123456789"
      },
      "headers": {
        "content-encoding": "NOTGZIP",
        "nhsd-end-user-organisation-ods": "X26"
      }
    };
    let serviceRequestSearch = {
      status: 200,
      body:JSON.stringify({
        resourceType: "Bundle",
        type: "searchset",
        total: 1,
        entry: [ 
          { resource: servicerequest}
        ]
      })
    }
    let taskRequestSearch = {
      status: 200,
      body:JSON.stringify({
        resourceType: "Bundle",
        type: "searchset",
        total: 1,
        entry: [ 
          { resource: task}
        ]
      })
    };
    let search_resource_pdm_instance = new search_resource_pdm([serviceRequestSearch, taskRequestSearch], []);
    let docrefresp1 = { "headers": { "status": 201, "Location": "https://some.server.nhs.uk/fhir/r4/DocumentReference/id12345"}, "body": { "resourceType": "DocumentReference"}}
    let post_document_ref_bars_helper_instance = new post_document_ref_bars_helper([docrefresp1], []);
    let create_resource_healthlake_instance = {
      createResource: jasmine.createSpy("createResource").and.returnValue(Promise.reject(new Error("unexpected error")))
    };
    let update_resource_healthlake_instance = new update_resource_healthlake([appointment, servicerequest, task], []);
    let response = await handler(event, create_resource_healthlake_instance, update_resource_healthlake_instance, 
      post_document_ref_bars_helper_instance, post_document_ref_bars_helper_instance, 
      search_resource_pdm_instance, getParameterCaseInsensitive, 
      process.env['APIKEYSECRET'], process.env['APIENVIRONMENT'], 
      process.env['APIKNAMEPARAM'], true);
    expect(response.statusCode).toEqual(500);
    expect(JSON.parse(response.body).result).toEqual("\"undefined\" is not valid JSON");
  });
});
 
