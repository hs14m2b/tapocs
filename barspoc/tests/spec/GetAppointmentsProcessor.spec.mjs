import { handler } from '../../next-ui/next-ui-lambdas/GetAppointmentsProcessor.mjs';
import { find_document_ref_bars_helper } from './helpers/find_document_ref_bars_helper.mjs'
import { getParameterCaseInsensitive } from '../../lambdas/api_common_functions.mjs';
describe("Appointments Search Processor", function() {
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
      },
      "body": "addresspostcode=&nhsnumber=9693893123&favcolour=blue"
    };
    let barsResponse1 = { "body": { "entry": [{ "resource": {"id": "123", "blah": "blaah1" }}] }, "headers": { "header1": "value1"} };
    let find_document_ref_bars_instance = new find_document_ref_bars_helper([barsResponse1], []);
    console.log("helper object is " + JSON.stringify(find_document_ref_bars_instance));
    let response = await handler(event, find_document_ref_bars_instance, find_document_ref_bars_instance, getParameterCaseInsensitive, process.env['APIKEYSECRET'], process.env['APIENVIRONMENT'], process.env['APIKNAMEPARAM'], true);
    console.log(JSON.stringify(response));
    expect(response.statusCode).toEqual(200);
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
    let find_document_ref_bars_instance = {
      findDocRef: jasmine.createSpy("findDocRef").and.returnValue(Promise.reject(new Error("unexpected error")))
    };
    let find_document_ref_pdm_instance = {
      findDocRef: jasmine.createSpy("findDocRef").and.returnValue(Promise.reject(new Error("unexpected error")))
    };
    let response = await handler(event, find_document_ref_bars_instance, find_document_ref_pdm_instance, getParameterCaseInsensitive, process.env['APIKEYSECRET'], process.env['APIENVIRONMENT'], process.env['APIKNAMEPARAM'], true);
    expect(response.statusCode).toEqual(500);
    expect(JSON.parse(response.body).result).toEqual("find appointments from BaRS failed");
  });
});
