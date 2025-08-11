import { handler } from '../../lambdas/AppointmentProcessor.mjs';
import { search_resource_healthlake } from './helpers/search_resource_healthlake_helper.mjs'
import { getParameterCaseInsensitive } from '../../lambdas/api_common_functions.mjs';
import { sendDocRef } from './helpers/post_document_ref_helper.mjs'
import { postResource } from './helpers/post_resource_healthlake_helper.mjs'
import { putResource } from './helpers/put_resource_healthlake_helper.mjs'
import mhdsbundle from './data/mhdsbundle.json' assert { type: "json" };
import appointment from '../../manualscripts/healthlakedirect/appointment-001.json' assert { type: "json" };
import jwt from 'jsonwebtoken'; // Ensure you have this library installed or use an equivalent

describe("Appointment Retrieve Processor", function() {
  process.env['APIENVIRONMENT'] = "int";
  process.env['APIKEYSECRET'] = "blah";
  process.env['APIKNAMEPARAM'] = "blah2";

  beforeEach(function() {
    console.log("do something before each test");
  });

  // create a test that compares a jwt in the nhsd-id-token header with the nhs number in the appointment resource

  it("compares the nhsd-id-token JWT NHS number with the appointment resource NHS number", async function() {
    let event = {
      "pathParameters": {
        "appointmentId": "123456789"
      },
      "headers": {
        "content-encoding": "NOTGZIP",
        "nhsd-end-user-organisation-ods": "X26",
        "nhsd-id-token": jwt.sign({ nhs_number: "9876543210" }, "test-secret") // Mock JWT with NHS number
      }
    };
  
    // Mock appointment resource with NHS number
    let appointment2 = JSON.parse(JSON.stringify(appointment));
    appointment2.participant[0].actor.identifier = { system: "https://fhir.nhs.uk/Id/nhs-number", value: "9876543210" };

    let hlr1 = { "body": JSON.stringify(appointment2) };
    let search_resource_healthlake_instance = new search_resource_healthlake([], [], [], [hlr1]);
  
  
    let response = await handler(event, search_resource_healthlake_instance, getParameterCaseInsensitive, process.env['APIKEYSECRET'], process.env['APIENVIRONMENT'], process.env['APIKNAMEPARAM']);
    console.log(JSON.stringify(response));
    // Decode the JWT to extract the NHS number
    let decodedToken = jwt.verify(event.headers["nhsd-id-token"], "test-secret");
    let nhsNumberFromToken = decodedToken.nhs_number;
  
    // Extract NHS number from the appointment resource
    let nhsNumberFromAppointment = (JSON.parse(response.body)).participant.find(participant => participant.actor.identifier.system === "https://fhir.nhs.uk/Id/nhs-number").actor.identifier.value;
    console.log("NHS number from token: " + nhsNumberFromToken);
    console.log("NHS number from appointment: " + nhsNumberFromAppointment);
    // Compare the two NHS numbers
    expect(nhsNumberFromToken).toEqual(nhsNumberFromAppointment);
    expect(response.statusCode).toEqual(200);
  });

  it("compares the nhsd-id-token JWT NHS number with the appointment resource NHS number and returns 403 if they do not match", async function() {
    let event = {
      "pathParameters": {
        "appointmentId": "123456789"
      },
      "headers": {
        "content-encoding": "NOTGZIP",
        "nhsd-end-user-organisation-ods": "X26",
        "nhsd-id-token": jwt.sign({ nhs_number: "9876543210" }, "test-secret") // Mock JWT with NHS number
      }
    };
  
    // Mock appointment resource with NHS number
    let appointment2 = JSON.parse(JSON.stringify(appointment));
    appointment2.participant[0].actor.identifier = { system: "https://fhir.nhs.uk/Id/nhs-number", value: "9876543211" };

    let hlr1 = { "body": JSON.stringify(appointment2) };
    let search_resource_healthlake_instance = new search_resource_healthlake([], [], [], [hlr1]);
  
  
    let response = await handler(event, search_resource_healthlake_instance, getParameterCaseInsensitive, process.env['APIKEYSECRET'], process.env['APIENVIRONMENT'], process.env['APIKNAMEPARAM']);
    console.log(JSON.stringify(response));

    expect(response.statusCode).toEqual(403);
  });

  it("can process a simple search from healthlake", async function() {
    let event = {
      "pathParameters": {
        "appointmentId": "123456789"
      },
      "headers": {
        "content-encoding": "NOTGZIP",
        "nhsd-end-user-organisation-ods": "X26"
      }
    };
    let hlr1 = { "body": JSON.stringify(appointment) };
    let search_resource_healthlake_instance = new search_resource_healthlake([], [], [hlr1]);
    console.log("helper object is " + JSON.stringify(search_resource_healthlake_instance));
    let response = await handler(event, search_resource_healthlake_instance, getParameterCaseInsensitive, process.env['APIKEYSECRET'], process.env['APIENVIRONMENT'], process.env['APIKNAMEPARAM']);
    console.log(JSON.stringify(response));
    expect(response.statusCode).toEqual(200);
  });

  it("returns 500 if searchHealthlake throws an error", async function() {
    let event = {
      "pathParameters": {
        "appointmentId": "123456789"
      },
      "headers": {
        "content-encoding": "NOTGZIP",
        "nhsd-end-user-organisation-ods": "X26"
      }
    };
    let search_resource_healthlake_instance = {
      getResource: jasmine.createSpy("getResource").and.throwError("search error")
    };
    let response = await handler(event, search_resource_healthlake_instance, getParameterCaseInsensitive,  process.env['APIKEYSECRET'], process.env['APIENVIRONMENT'], process.env['APIKNAMEPARAM']);
    expect(response.statusCode).toEqual(500);
    expect(JSON.parse(response.body).result).toEqual("searchFhirServer failed");
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
    let search_resource_healthlake_instance = {
      getResource: jasmine.createSpy("getResource").and.returnValue(Promise.reject(new Error("unexpected error")))
    };
    let response = await handler(event, search_resource_healthlake_instance, getParameterCaseInsensitive, process.env['APIKEYSECRET'], process.env['APIENVIRONMENT'], process.env['APIKNAMEPARAM']);
    expect(response.statusCode).toEqual(500);
    expect(JSON.parse(response.body).result).toEqual("searchFhirServer failed");
  });
});
 
