import { handler } from '../../next-ui/next-ui-lambdas/GetSlotsProcessor.mjs';
import { find_slots_bars_helper } from './helpers/find_slots_bars_helper.mjs'
import { getParameterCaseInsensitive } from '../../lambdas/api_common_functions.mjs';
describe("Slot Query Processor", function() {
  process.env['APIENVIRONMENT'] = "int";
  process.env['APIKEYSECRET'] = "blah";
  process.env['APIKNAMEPARAM'] = "blah2";

  beforeEach(function() {
    console.log("do something before each test");
  });

  it("can process a simple search from BaRS", async function() {
    let event = {
      "queryStrings": {
        "qs1": "qsvalue1"
      },
      "headers": {
        "content-encoding": "NOTGZIP",
        "nhsd-end-user-organisation-ods": "X26"
      },
      "body": "barsserviceid=matthewbrown&healthcareSerivceId=HealthcareService/1234&favcolour=blue"
    };
    let barsResponse1 = { "body": { "entry": [{ "blah": "blaah1" }] }, "headers": { "header1": "value1"} };
    let find_slots_bars_instance = new find_slots_bars_helper([barsResponse1], []);
    console.log("helper object is " + JSON.stringify(find_slots_bars_instance));
    let response = await handler(event, find_slots_bars_instance, getParameterCaseInsensitive, process.env['APIKEYSECRET'], process.env['APIENVIRONMENT'], process.env['APIKNAMEPARAM']);
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
    let find_slots_bars_instance = {
      findSlots: jasmine.createSpy("findSlots").and.returnValue(Promise.reject(new Error("unexpected error")))
    };
    let response = await handler(event, find_slots_bars_instance, getParameterCaseInsensitive, process.env['APIKEYSECRET'], process.env['APIENVIRONMENT'], process.env['APIKNAMEPARAM']);
    expect(response.statusCode).toEqual(500);
    expect(JSON.parse(response.body).result).toEqual("find slots from BaRS failed");
  });
});
 
