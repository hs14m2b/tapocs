import { handler } from '../../lambdas/GetAppointmentsProcessor.mjs';
import { find_document_ref_bars_helper } from './helpers/find_document_ref_bars_helper.mjs'
import { getParameterCaseInsensitive } from '../../lambdas/api_common_functions.mjs';
describe("Appointments Search Processor", function() {
  process.env['APIENVIRONMENT'] = "int";
  process.env['APIKEYSECRET'] = "blah";
  process.env['APIKNAMEPARAM'] = "blah2";

  beforeEach(function() {
    console.log("do something before each test");
  });

  it("can get appointments from PDM when NRL is disabled", async function() {
    let event =   { "inputText": "Whatare my appointments?", 
   "sessionId": "abc123", 
   "actionGroup": "WeatherActions", 
   "function": "getCurrentWeather", 
   "parameters": [ { "name": "nhsnumber", "type": "string", "value": "9661034524" } ], 
   "agent": { "name": "SupportAgent", "id": "xxxx", "version": "1" }, 
   "sessionAttributes": { "someKey": "someValue" }, "promptSessionAttributes": {},
    "messageVersion": "1.0" };
    let barsResponse1 = { "body": { "entry": [] }, "headers": { "header1": "value1"} };
    let pdmResponse1 = { "body": { "entry": [{ "resource": {"id": "123", "blah": "blaah1" }}] }, "headers": { "header1": "value1"} };
    let find_document_ref_bars_instance = new find_document_ref_bars_helper([pdmResponse1], []);
    let response = await handler(event, find_document_ref_bars_instance, find_document_ref_bars_instance, getParameterCaseInsensitive, process.env['APIKEYSECRET'], process.env['APIENVIRONMENT'], process.env['APIKNAMEPARAM'], false);
    console.log(JSON.stringify(response));
    let isResponseState = (response.response.functionResponse.responseState) ? response.response.functionResponse.responseState : "MISSING";
    console.log("response state is " + isResponseState);
    expect(isResponseState).toEqual("MISSING");
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
    let response = await handler(event, find_document_ref_bars_instance, find_document_ref_pdm_instance, getParameterCaseInsensitive, process.env['APIKEYSECRET'], process.env['APIENVIRONMENT'], process.env['APIKNAMEPARAM'], false);
    expect(response.response.functionResponse.responseState).toEqual("FAILURE");
  });
});
 
