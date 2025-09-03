import { handler } from '../../lambdas/AppointmentUpdateProcessor.mjs';
import { search_resource_healthlake } from './helpers/search_resource_healthlake_helper.mjs'
import { update_resource_healthlake } from './helpers/update_resource_healthlake_helper.mjs';
import { delete_resource_pdm } from './helpers/delete_resource_pdm_helper.mjs';
import { get_document_ref_object } from './helpers/get_document_ref_helper.mjs';
import { getParameterCaseInsensitive } from '../../lambdas/api_common_functions.mjs';
import appointment3 from './data/appointment-003.json' with { type: "json" };
import appointment2 from './data/appointment-002.json' with { type: "json" };
import jwt from 'jsonwebtoken';

describe("Appointment Update Processor", function() {
  process.env['APIENVIRONMENT'] = "int";
  process.env['APIKEYSECRET'] = "blah";
  process.env['APIKNAMEPARAM'] = "blah2";

  beforeEach(function() {
    console.log("do something before each test");
  });

  it("updates appointment if NHS number matches JWT", async function() {
    let event = {
      "pathParameters": {
        "appointmentId": "123456789"
      },
      "headers": {
        "content-encoding": "NOTGZIP",
        "nhsd-end-user-organisation-ods": "X26",
        "nhsd-id-token": jwt.sign({ nhs_number: "9661034524" }, "test-secret")
      },
      "body": JSON.stringify(appointment3)
    };
    //let appointment2 = JSON.parse(JSON.stringify(appointment2));
    let hlr1 = { "body": JSON.stringify(appointment2) };
    let hlr2 = { "body": JSON.stringify({"resourceType": "Slot", "status": "busy", "meta": {"versionId": "1", "lastUpdated": "2021-01-01T00:00:00Z"}}) };
    let hlr3 = { "body": JSON.stringify(appointment3) };
    let hlr4 = { "body": JSON.stringify({"resourceType": "Slot", "status": "free", "meta": {"versionId": "2", "lastUpdated": "2025-01-01T00:00:00Z"}}) };
    let hlr5 = { "body": JSON.stringify({"resourceType": "DocumentReference", "id": "4a3836f5-2d42-4d3e-87c1-680173b7fa5c", "meta": {"versionId": "1", "lastUpdated": "2021-01-01T00:00:00Z"}}) };
    let hlr6 = { "body": JSON.stringify({"resourceType": "ServiceRequest", "id": "4a3836f5-2d42-4d3e-87c1-680173b7fa5c", "status": "completed", "meta": {"versionId": "1", "lastUpdated": "2021-01-01T00:00:00Z"}}) };
    let hlr7 = { "body": JSON.stringify({"resourceType": "ServiceRequest", "id": "4a3836f5-2d42-4d3e-87c1-680173b7fa5c", "status": "draft", "meta": {"versionId": "1", "lastUpdated": "2021-01-01T00:00:00Z"}}) };
    let hlr8 = { "body": JSON.stringify({"resourceType": "Bundle", "entry": [{"resource":{"resourceType": "Task", "status": "completed"}}]}) };
    let hlr9 = { "body": JSON.stringify({"resourceType": "Task", "status": "ready"}) };
    let barsresponse1 = { "body": {"resourceType": "DocumentReference", "id": "1234567890", "meta": {"versionId": "1", "lastUpdated": "2021-01-01T00:00:00Z"}} };
    //calls to search are for appointment2 - get, slot - get, documentreference - get, documentreference - search
    let search_resource_healthlake_instance = new search_resource_healthlake([hlr8], [], [hlr1, hlr2, hlr5, hlr6], []);
    let update_resource_healthlake_instance = new update_resource_healthlake([hlr4, hlr3, hlr7, hlr9], []);
    let get_document_ref_object_instance = new get_document_ref_object([barsresponse1], []);
    let delete_resource_pdm_instance = new delete_resource_pdm([204], []);
    //event, fhirCreateHelper, fhirUpdateHelper, fhirSearchHelper, putDocumentRefBarsObject, getDocumentRefBarsObject, findDocumentRefBarsObject, getParameterCaseInsensitive, APIENVIRONMENT, APIKEYSECRET, APIKNAMEPARAM, NRLENABLED
    let response = await handler(event, "fhirCreateHelper", update_resource_healthlake_instance, search_resource_healthlake_instance, delete_resource_pdm_instance, "putDocumentRefBarsObject", get_document_ref_object_instance, "findDocumentRefBarsObject", getParameterCaseInsensitive, process.env['APIENVIRONMENT'], process.env['APIKEYSECRET'], process.env['APIKNAMEPARAM'], true);
    let decodedToken = jwt.verify(event.headers["nhsd-id-token"], "test-secret");
    let nhsNumberFromToken = decodedToken.nhs_number;
    let nhsNumberFromAppointment = (JSON.parse(response.body)).participant.find(participant => participant.actor.identifier.system === "https://fhir.nhs.uk/Id/nhs-number").actor.identifier.value;
    expect(nhsNumberFromToken).toEqual(nhsNumberFromAppointment);
    expect(response.statusCode).toEqual(200);
  });

});
