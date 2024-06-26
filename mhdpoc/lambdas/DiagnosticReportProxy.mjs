import diagnosticreport001 from './data/diagnosticreport001.json' assert { type: 'json' };
import { readFileSync } from 'node:fs';
import { getSecretValue } from './api_common_functions.mjs';

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
        let pointerUrl = getHeaderCaseInsensitive(event, "NHSE-NRL-Pointer-URL");
        console.log("pointerUrl is " + pointerUrl)
        let diagnosticReportResponse = await getDiagnosticReport(pointerUrl);
        //hardcode response initially
        let response = {
            statusCode: 200,
            "headers": {
                "Content-Type": "application/fhir+json"
            },
            body: JSON.stringify(diagnosticreport001)
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

function getHeaderCaseInsensitive(event, header){
    console.log("Header to look for is " + header);
    for (let headerName in event.headers){
        console.log("headerName is " + headerName);
        if (headerName.toLowerCase() == header.toLowerCase()) return event.headers[headerName];
    }
    return "";
}

async function getDiagnosticReport(pointerUrl)
    {
      let currentTime = Date.now();
      //get the client certificate and key if not present or last retrieved more than 5 minutes ago
      if (!CLIENTCERTIFICATE || ((currentTime - certsLastRetrieved) > 300000)){
        console.log("retrieving certificates from secrets manager");
        CLIENTCERTIFICATE = await getSecretValue(SECRETSMGRCERT);
        CLIENTCERTIFICATEKEY = await getSecretValue(SECRETSMGRCERTKEY);
        //set certs last retrieve to now
        certsLastRetrieved = currentTime;
      }
      //extract the host
      let urlObject = new URL(pointerUrl);
      // request option
      let options = {
        host: urlObject.hostname,
        port: 443,
        method: 'GET',
        path: urlObject.pathname,
        rejectUnauthorized: false,
        key: CLIENTCERTIFICATEKEY, // readFileSync('certs/tsassolarchdemoapi.key'),
        cert: CLIENTCERTIFICATE, // readFileSync('certs/tsassolarchdemoapi.crt'),  
        headers: {
          //'Authorization': 'Bearer '+ access_token,
          'accept': 'application/fhir+json;version=1'
        }
      };
    
      console.log("request options are  " + JSON.stringify(options));
      return new Promise(function (resolve, reject) {
          // request object
          var req = https.request(options, function (res) {
              var result = '';
              console.log("HTTP status code: " + res.statusCode);
              res.on('data', function (chunk) {
                  result += chunk;
              });
              res.on('end', function () {
                  console.log(result);
                  let response = {
                    "status": res.statusCode,
                    "body": result
                  }
                  resolve(response);
              });
              res.on('error', function (err) {
                  console.log(err);
                  reject(err);
              })
          });
           
          // req error
          req.on('error', function (err) {
            console.log(err);
          });
           
          //send request
          req.end();
      });
    }
  