import { handler } from '../../lambdas/AppointmentUpdateEventProcessor.mjs';
import { search_resource_healthlake } from './helpers/search_resource_healthlake_helper.mjs'
import { update_resource_healthlake } from './helpers/update_resource_healthlake_helper.mjs';
import { delete_resource_pdm } from './helpers/delete_resource_pdm_helper.mjs';
import { get_document_ref_object } from './helpers/get_document_ref_helper.mjs';
import { snsCommonFunctionHelperObject } from './helpers/sns_common_functions_helper.mjs';
import { getParameterCaseInsensitive } from '../../lambdas/api_common_functions.mjs';
import appointment3 from './data/appointment-003.json' with { type: "json" };
import appointment2 from './data/appointment-002.json' with { type: "json" };
import jwt from 'jsonwebtoken';

describe("Appointment Update Event Processor", function() {
  process.env['APIENVIRONMENT'] = "int";
  process.env['APIKEYSECRET'] = "blah";
  process.env['APIKNAMEPARAM'] = "blah2";

  beforeEach(function() {
    console.log("do something before each test");
  });

  it("processes cancellation event", async function() {
    let originalEvent = {
      "event":{
        "pathParameters": {
          "appointmentId": "123456789"
        },
        "headers": {
          "content-encoding": "NOTGZIP",
          "nhsd-end-user-organisation-ods": "X26",
          "nhsd-id-token": jwt.sign({ nhs_number: "9661034524" }, "test-secret")
        },
        "body": JSON.stringify(appointment3)
      },
      "eventType": "AppointmentCancellation",
      "appointment": appointment3
    };
    let snsEvent = {
      "Records": [
        {
          "Sns": {
            "Message": JSON.stringify(originalEvent)
          }
        }
      ]
    };
    let event = snsEvent;
    //let appointment2 = JSON.parse(JSON.stringify(appointment2));
    //let hlr1 = { "body": JSON.stringify(appointment2) };
    //let hlr2 = { "body": JSON.stringify({"resourceType": "Slot", "status": "busy", "meta": {"versionId": "1", "lastUpdated": "2021-01-01T00:00:00Z"}}) };
    //let hlr3 = { "body": JSON.stringify(appointment3) };
    //let hlr4 = { "body": JSON.stringify({"resourceType": "Slot", "status": "free", "meta": {"versionId": "2", "lastUpdated": "2025-01-01T00:00:00Z"}}) };
    let hlr5 = { "body": JSON.stringify({"resourceType": "DocumentReference", "id": "4a3836f5-2d42-4d3e-87c1-680173b7fa5c", "meta": {"versionId": "1", "lastUpdated": "2021-01-01T00:00:00Z"}}) };
    let hlr6 = { "body": JSON.stringify({"resourceType": "ServiceRequest", "id": "4a3836f5-2d42-4d3e-87c1-680173b7fa5c", "status": "completed", "meta": {"versionId": "1", "lastUpdated": "2021-01-01T00:00:00Z"}}) };
    let hlr7 = { "body": JSON.stringify({"resourceType": "ServiceRequest", "id": "4a3836f5-2d42-4d3e-87c1-680173b7fa5c", "status": "draft", "meta": {"versionId": "1", "lastUpdated": "2021-01-01T00:00:00Z"}}) };
    let hlr8 = { "body": JSON.stringify({"resourceType": "Bundle", "entry": [{"resource":{"resourceType": "Task", "status": "completed"}}]}) };
    let hlr9 = { "body": JSON.stringify({"resourceType": "Task", "status": "ready"}) };
    let barsresponse1 = { "body": {"resourceType": "DocumentReference", "id": "1234567890", "meta": {"versionId": "1", "lastUpdated": "2021-01-01T00:00:00Z"}} };
    let snsr1 = { "MessageId": "abc123" };
    //calls to search are for appointment2 - get, slot - get, documentreference - get, documentreference - search
    let search_resource_healthlake_instance = new search_resource_healthlake([hlr8], [], [ hlr5, hlr6], []);
    let update_resource_healthlake_instance = new update_resource_healthlake([hlr7, hlr9], []);
    let get_document_ref_object_instance = new get_document_ref_object([barsresponse1], []);
    let delete_resource_pdm_instance = new delete_resource_pdm([204], []);
    let snsCommonFunctionHelperObjectInstance = new snsCommonFunctionHelperObject([snsr1]);
    //event, fhirServerCreateHelperObject, fhirServerUpdateHelperObject, fhirServerSearchHelperObject, fhirServerDeleteHelperObject, putDocumentRefBarsObject, getDocumentRefBarsObject, findDocumentRefBarsObject, snsCommonFunctionObjectInstance, getParameterCaseInsensitive, APIENVIRONMENT, APIKEYSECRET, APIKNAMEPARAM, NRLENABLED, APPTREBOOKTOPICARN
    let response = await handler(event, "fhirCreateHelper", update_resource_healthlake_instance, search_resource_healthlake_instance, delete_resource_pdm_instance, "putDocumentRefBarsObject", get_document_ref_object_instance, "findDocumentRefBarsObject", snsCommonFunctionHelperObjectInstance, getParameterCaseInsensitive, process.env['APIENVIRONMENT'], process.env['APIKEYSECRET'], process.env['APIKNAMEPARAM'], true, "APPTREBOOKTOPICARN");
    expect(response).toEqual("OK");
  });

  it("processes reschedule event with NRL disabled", async function() {
    let originalEvent = {
      "event":{
        "pathParameters": {
          "appointmentId": "123456789"
        },
        "headers": {
          "content-encoding": "NOTGZIP",
          "nhsd-end-user-organisation-ods": "X26",
          "nhsd-id-token": jwt.sign({ nhs_number: "9661034524" }, "test-secret")
        },
        "body": JSON.stringify(appointment2)
      },
      "eventType": "AppointmentReschedule",
      "appointment": appointment2,
      "originalSlot": {"id": "originalslotid", resourceType: "Slot", status: "free"}
    };
    let snsEvent = {
      "Records": [
        {
          "Sns": {
            "Message": JSON.stringify(originalEvent)
          }
        }
      ]
    };
    let event = snsEvent;
    //let appointment2 = JSON.parse(JSON.stringify(appointment2));
    let hlr1 = { "body": JSON.stringify({"id": "originalslotid", resourceType: "Slot", status: "free"}) };
    //let hlr2 = { "body": JSON.stringify({"resourceType": "Slot", "status": "busy", "meta": {"versionId": "1", "lastUpdated": "2021-01-01T00:00:00Z"}}) };
    //let hlr3 = { "body": JSON.stringify(appointment3) };
    //let hlr4 = { "body": JSON.stringify({"resourceType": "Slot", "status": "free", "meta": {"versionId": "2", "lastUpdated": "2025-01-01T00:00:00Z"}}) };
    let hlr5 = { "body": JSON.stringify({"identifier": [{"system": "https://fhir.nhs.uk/Id/BaRS-Identifier", "value": appointment2.id}],
       "resourceType": "DocumentReference", 
       "id": "5a3836f5-2d42-4d3e-87c1-680173b7fa5c", 
       "meta": {"versionId": "1", "lastUpdated": "2021-01-01T00:00:00Z"},
       "context": {"period": {"start": appointment2.start, "end": appointment2.end}}
      }) };
    let hlr6 = { "body": JSON.stringify({"resourceType": "ServiceRequest", "id": "4a3836f5-2d42-4d3e-87c1-680173b7fa5c", "status": "completed", "meta": {"versionId": "1", "lastUpdated": "2021-01-01T00:00:00Z"}}) };
    let hlr7 = { "body": JSON.stringify({"resourceType": "ServiceRequest", "id": "4a3836f5-2d42-4d3e-87c1-680173b7fa5c", "status": "draft", "meta": {"versionId": "1", "lastUpdated": "2021-01-01T00:00:00Z"}}) };
    let hlr8 = { "body": JSON.stringify({"resourceType": "Bundle", "entry": [{"resource":{"identifier": [{"system": "https://fhir.nhs.uk/Id/BaRS-Identifier", "value": appointment2.id}],
       "resourceType": "DocumentReference", 
       "id": "5a3836f5-2d42-4d3e-87c1-680173b7fa5c", 
       "meta": {"versionId": "1", "lastUpdated": "2021-01-01T00:00:00Z"},
       "context": {"period": {"start": appointment2.start, "end": appointment2.end}}
      }}]}) };
    let hlr9 = { "body": JSON.stringify({"resourceType": "Task", "status": "ready"}) };
    let barsresponse1 = { "body": {"resourceType": "DocumentReference", "id": "1234567890", "meta": {"versionId": "1", "lastUpdated": "2021-01-01T00:00:00Z"}} };
    let snsr1 = { "MessageId": "abc123" };
    //calls to search are for appointment2 - get, slot - get, documentreference - get, documentreference - search
    let search_resource_healthlake_instance = new search_resource_healthlake([hlr8], [], [ hlr5, hlr6], []);
    let update_resource_healthlake_instance = new update_resource_healthlake([hlr5, hlr9], []);
    let get_document_ref_object_instance = new get_document_ref_object([barsresponse1], []);
    let delete_resource_pdm_instance = new delete_resource_pdm([204], []);
    let snsCommonFunctionHelperObjectInstance = new snsCommonFunctionHelperObject([snsr1]);
    //event, fhirServerCreateHelperObject, fhirServerUpdateHelperObject, fhirServerSearchHelperObject, fhirServerDeleteHelperObject, putDocumentRefBarsObject, getDocumentRefBarsObject, findDocumentRefBarsObject, snsCommonFunctionObjectInstance, getParameterCaseInsensitive, APIENVIRONMENT, APIKEYSECRET, APIKNAMEPARAM, NRLENABLED, APPTREBOOKTOPICARN
    let response = await handler(event, "fhirCreateHelper", update_resource_healthlake_instance, search_resource_healthlake_instance, delete_resource_pdm_instance, "putDocumentRefBarsObject", get_document_ref_object_instance, "findDocumentRefBarsObject", snsCommonFunctionHelperObjectInstance, getParameterCaseInsensitive, process.env['APIENVIRONMENT'], process.env['APIKEYSECRET'], process.env['APIKNAMEPARAM'], false, "APPTREBOOKTOPICARN");
    expect(response).toEqual("OK");
  });

});
