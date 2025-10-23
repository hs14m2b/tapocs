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
    let event =   {
      "messageVersion": "1.0",
      "function": "GetAppointmentsAction",
      "parameters": [
          {
              "name": "nhsnumber",
              "type": "string",
              "value": "9661034524"
          }
      ],
      "inputText": "Hello, what is my next NHS appointment?",
      "sessionId": "d7d8a702-2795-406e-8eae-5543396c37e7",
      "agent": {
          "name": "aiagentpoc-int-agent",
          "version": "DRAFT",
          "id": "N8JM7Q8BTF",
          "alias": "TSTALIASID"
      },
      "actionGroup": "GetAppointmentsActionGroup",
      "sessionAttributes": {
          "nhsnumber": "9661034524",
          "idtoken": "some-id-token"
      },
      "promptSessionAttributes": {
          "nhsnumber": "9661034524",
          "idtoken": "some-id-token"
      }
    };
    let barsResponse1 = { "body": { "entry": [] }, "headers": { "header1": "value1"} };
    //set the appointment date to be in the future
    Date.prototype.addDays = function(days) {
      var date = new Date(this.valueOf());
      date.setDate(date.getDate() + days);
      return date;
    };
    let start = (new Date()).addDays(1).toISOString();
    let pdmResponse1 = { "body": { "entry": 
        [{ 
        "resource": {"id": "123", "blah": "blaah1",
          "context": { "period": { "start": start } }
         }
        }] 
      }, 
      "headers": { "header1": "value1"}
    };
    let find_document_ref_bars_instance = new find_document_ref_bars_helper([pdmResponse1], []);
    let response = await handler(event, find_document_ref_bars_instance, find_document_ref_bars_instance, getParameterCaseInsensitive, process.env['APIKEYSECRET'], process.env['APIENVIRONMENT'], process.env['APIKNAMEPARAM'], false, (new Date()).toISOString());
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
    let response = await handler(event, find_document_ref_bars_instance, find_document_ref_pdm_instance, getParameterCaseInsensitive, process.env['APIKEYSECRET'], process.env['APIENVIRONMENT'], process.env['APIKNAMEPARAM'], false, (new Date()).toISOString());
    expect(response.response.functionResponse.responseState).toEqual("FAILURE");
  });
});
 
