import { handler } from '../../next-ui/next-ui-lambdas/GetAppointmentProcessor.mjs';
import { get_appointment_bars_helper } from './helpers/get_appointment_bars_helper.mjs'
import { getParameterCaseInsensitive } from '../../lambdas/api_common_functions.mjs';
describe("GetAppointment Processor", function() {
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
      "body": "barsidentifier=9693893123&barsserviceid=blue"
    };
    let barsResponse1 = { "body": { "entry": [{ "blah": "blaah1" }] }, "headers": { "header1": "value1"} };
    let get_appointment_bars_helper_instance = new get_appointment_bars_helper([barsResponse1], []);
    console.log("helper object is " + JSON.stringify(get_appointment_bars_helper_instance));
    let response = await handler(event, get_appointment_bars_helper_instance, getParameterCaseInsensitive, process.env['APIKEYSECRET'], process.env['APIENVIRONMENT'], process.env['APIKNAMEPARAM']);
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
    let get_appointment_bars_helper_instance = {
      getAppointment: jasmine.createSpy("getAppointment").and.returnValue(Promise.reject(new Error("unexpected error")))
    };
    let response = await handler(event, get_appointment_bars_helper_instance, getParameterCaseInsensitive, process.env['APIKEYSECRET'], process.env['APIENVIRONMENT'], process.env['APIKNAMEPARAM']);
    expect(response.statusCode).toEqual(500);
    expect(JSON.parse(response.body).result).toEqual("get appointment from BaRS failed");
  });
});
 
