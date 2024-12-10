import diagnosticreport001 from './data/diagnosticreport001.json' assert { type: 'json' };
import { getParameterCaseInsensitive } from './api_common_functions.mjs';
import { apiCommonFunctionObject } from './api_common_function_object.mjs';

const HTTPS = "https://";
const SECRETSMGRCERT = process.env["SECRETSMGRCERT"];
const SECRETSMGRCERTKEY = process.env["SECRETSMGRCERTKEY"];


var CLIENTCERTIFICATE;
var CLIENTCERTIFICATEKEY;
var certsLastRetrieved = 0;

let https;
try {
  https = await import('node:https');
} catch (err) {
  console.log('https support is disabled!');
}

export const handler = async (event) => {
  console.log(JSON.stringify(event));
    try {
        //look for NHSE-NRL-Pointer-URL header
        let pointerUrl = getParameterCaseInsensitive(event.headers, "NHSE-NRL-Pointer-URL");
        if (!pointerUrl || pointerUrl === undefined) {
            let response = {
                statusCode: 400,
                "headers": {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ "error": "Missing NHSE-NRL-Pointer-URL header" })
            }
            return response;
        }
        console.log("pointerUrl is " + pointerUrl)
        let diagnosticReportResponse = await getDiagnosticReport(pointerUrl);
        //hardcode response initially
        let response = {
            statusCode: 200,
            "headers": {
                "Content-Type": "application/fhir+json"
            },
            body: diagnosticReportResponse.body
        };
        console.log(JSON.stringify(response));
        return response;
    } catch (error) {
        console.log("caught error " + error.message);
        let response = {
            statusCode: 500,
            "headers": {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ "result": error.message })
        }
        return response;
    }
}

async function getDiagnosticReport(pointerUrl)
    {
      let currentTime = Date.now();
      //get the client certificate and key if not present or last retrieved more than 5 minutes ago
      if (!CLIENTCERTIFICATE || ((currentTime - certsLastRetrieved) > 300000)){
        console.log("retrieving certificates from secrets manager");
        CLIENTCERTIFICATE = await apiCommonFunctionObject.getSecretValue(SECRETSMGRCERT);
        CLIENTCERTIFICATEKEY = await apiCommonFunctionObject.getSecretValue(SECRETSMGRCERTKEY);
        //set certs last retrieve to now
        certsLastRetrieved = currentTime;
      }

      return await apiCommonFunctionObject.getDiagnosticReportFromLocalServer(pointerUrl, CLIENTCERTIFICATE, CLIENTCERTIFICATEKEY);

    }
