import { handler } from '../../lambdas/PDMResourceEventProcessor.mjs';
import { create_resource_fhir } from './helpers/create_resource_fhir_helper.mjs'
import { search_resource_healthlake } from './helpers/search_resource_healthlake_helper.mjs'
import { update_resource_healthlake } from './helpers/update_resource_healthlake_helper.mjs';
import { delete_resource_pdm } from './helpers/delete_resource_pdm_helper.mjs';
import { snsCommonFunctionHelperObject } from './helpers/sns_common_functions_helper.mjs';
import { getParameterCaseInsensitive } from '../../lambdas/api_common_functions.mjs';
import appointment3 from './data/appointment-003.json' with { type: "json" };
import appointment2 from './data/appointment-002.json' with { type: "json" };
import jwt from 'jsonwebtoken';

describe("PDM Resource Event Processor", function() {
  process.env['APIENVIRONMENT'] = "int";
  process.env['APIKEYSECRET'] = "blah";
  process.env['APIKNAMEPARAM'] = "blah2";
  process.env['PDMRESOURCETOPICARN'] = "PDMRESOURCETOPICARN";

  beforeEach(function() {
    console.log("do something before each test");
  });

  it("processes Create action", async function() {
    let resourceJson = appointment3;
    let resourceType = "Appointment";
    let action = "Create";

    let snsEvent = {
      "Records": [
        {
          "Sns": {
            "MessageId": "abc123",
            "Message": JSON.stringify({resource: resourceJson, resourceType: resourceType, action: action})
          }
        }
      ]
    };
    let event = snsEvent;
    let hlr1 = { "body": JSON.stringify(appointment2) };
    let snsr1 = { "MessageId": "abc123" };
    //calls to search are for appointment2 - get, slot - get, documentreference - get, documentreference - search
    let create_resource_fhir_instance = new create_resource_fhir([hlr1], []);
    let search_resource_healthlake_instance = new search_resource_healthlake([], [], [ ], []);
    let update_resource_healthlake_instance = new update_resource_healthlake([], []);
    let delete_resource_pdm_instance = new delete_resource_pdm([204], []);
    let snsCommonFunctionHelperObjectInstance = new snsCommonFunctionHelperObject([snsr1]);
    //event, fhirCreateHelper, fhirUpdateHelper, fhirSearchHelper, fhirDeleteHelper, snsCommonFunctionObjectInstance, getParameterCaseInsensitive, APIENVIRONMENT, APIKEYSECRET, APIKNAMEPARAM, PDMRESOURCETOPICARN
    let response = await handler(event, create_resource_fhir_instance, update_resource_healthlake_instance, search_resource_healthlake_instance, delete_resource_pdm_instance, snsCommonFunctionHelperObjectInstance, getParameterCaseInsensitive, process.env['APIENVIRONMENT'], process.env['APIKEYSECRET'], process.env['APIKNAMEPARAM'], true, process.env['PDMRESOURCETOPICARN']);
    expect(response.successMessages[0]).toEqual("abc123");
  });

  it("errors when action unknown", async function() {
    let resourceJson = appointment3;
    let resourceType = "Appointment";
    let action = "UnknownAction";

    let snsEvent = {
      "Records": [
        {
          "Sns": {
            "MessageId": "abc123",
            "Message": JSON.stringify({resource: resourceJson, resourceType: resourceType, action: action})
          }
        }
      ]
    };
    let event = snsEvent;
    let hlr1 = { "body": JSON.stringify(appointment2) };
    let snsr1 = { "MessageId": "abc123" };
    //calls to search are for appointment2 - get, slot - get, documentreference - get, documentreference - search
    let create_resource_fhir_instance = new create_resource_fhir([hlr1], []);
    let search_resource_healthlake_instance = new search_resource_healthlake([], [], [ ], []);
    let update_resource_healthlake_instance = new update_resource_healthlake([], []);
    let delete_resource_pdm_instance = new delete_resource_pdm([204], []);
    let snsCommonFunctionHelperObjectInstance = new snsCommonFunctionHelperObject([snsr1]);
    //event, fhirCreateHelper, fhirUpdateHelper, fhirSearchHelper, fhirDeleteHelper, snsCommonFunctionObjectInstance, getParameterCaseInsensitive, APIENVIRONMENT, APIKEYSECRET, APIKNAMEPARAM, PDMRESOURCETOPICARN
    let response = await handler(event, create_resource_fhir_instance, update_resource_healthlake_instance, search_resource_healthlake_instance, delete_resource_pdm_instance, snsCommonFunctionHelperObjectInstance, getParameterCaseInsensitive, process.env['APIENVIRONMENT'], process.env['APIKEYSECRET'], process.env['APIKNAMEPARAM'], true, process.env['PDMRESOURCETOPICARN']);
    expect(response.errorMessages[0]).toEqual("abc123");
  });

});
