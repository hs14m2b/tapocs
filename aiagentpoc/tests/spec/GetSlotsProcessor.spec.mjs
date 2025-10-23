import { handler } from '../../lambdas/GetSlotsProcessor.mjs';
import { find_slots_bars_helper } from './helpers/find_slots_bars_helper.mjs'
import { getParameterCaseInsensitive } from '../../lambdas/api_common_functions.mjs';
describe("Slots Search Processor", function() {
  process.env['APIENVIRONMENT'] = "int";
  process.env['APIKEYSECRET'] = "blah";
  process.env['APIKNAMEPARAM'] = "blah2";

  beforeEach(function() {
    console.log("do something before each test");
  });

  it("can get slots from BaRS", async function() {
    let event =   {
      "messageVersion": "1.0",
      "function": "GetSlotsAction",
      "parameters": [
          {
              "name": "healthcareserviceid",
              "type": "string",
              "value": "123456789013456789"
          },
          {
              "name": "dosserviceid",
              "type": "string",
              "value": "9876543210987654321"
          }
      ],
      "inputText": "I'd like to change my appointment",
      "sessionId": "d7d8a702-2795-406e-8eae-5543396c37e7",
      "agent": {
          "name": "aiagentpoc-int-agent",
          "version": "DRAFT",
          "id": "N8JM7Q8BTF",
          "alias": "TSTALIASID"
      },
      "actionGroup": "GetSlotsActionGroup",
      "sessionAttributes": {
          "nhsnumber": "9661034524",
          "idtoken": "some-id-token"
      },
      "promptSessionAttributes": {
          "nhsnumber": "9661034524",
          "idtoken": "some-id-token"
      }
    };
    //set the appointment date to be in the future
    Date.prototype.addDays = function(days) {
      var date = new Date(this.valueOf());
      date.setDate(date.getDate() + days);
      return date;
    };
    let start = (new Date()).addDays(1).toISOString();
    let barsResponse1 = { "body": { "entry": [
        { "resource": { "id": "123", "blah": "blaah1", "resourceType": "Slot", "start": start } },
        { "resource": { "id": "456", "blah": "blaah2", "resourceType": "Slot", "start": start } }
    ] }, "headers": { "header1": "value1"} };
    let find_slots_bars_helper_instance = new find_slots_bars_helper([barsResponse1], []);
    let response = await handler(event, find_slots_bars_helper_instance, getParameterCaseInsensitive, process.env['APIKEYSECRET'], process.env['APIENVIRONMENT'], process.env['APIKNAMEPARAM'], false);
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
    let find_slots_bars_helper_instance = {
      findDocRef: jasmine.createSpy("findSlots").and.returnValue(Promise.reject(new Error("unexpected error")))
    };
    let response = await handler(event, find_slots_bars_helper_instance, getParameterCaseInsensitive, process.env['APIKEYSECRET'], process.env['APIENVIRONMENT'], process.env['APIKNAMEPARAM'], false);
    expect(response.response.functionResponse.responseState).toEqual("FAILURE");
  });
});
 
