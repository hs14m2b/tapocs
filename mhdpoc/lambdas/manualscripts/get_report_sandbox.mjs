import { createSignedJwtForAuth, getOAuth2AccessToken } from '../api_common_functions.mjs';

import { readFileSync } from 'node:fs';

const apiClientPrivateKey = readFileSync('../../certs/mhdtest001.key', 'utf8');

import { URLSearchParams } from 'url';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
const { sign } = jwt;
const HTTPS = "https://";
const ODSCode = "Y05868";
const OAuthAPIKey = "B05dSmlu7zIXDAApxP9qRhAAOGwk9MUG";

let https;
try {
  https = await import('node:https');
} catch (err) {
  console.log('https support is disabled!');
}
let reportId = "Y05868-93681c2b-33a3-49ca-9899-276685cb6495";//"Y05868-" + "1e404af3-077f-4bee-b7a6-a9be97e1ce01";// "1e404af3-077f-4bee-b7a6-a9be97e1ce01";


async function getReport (reportId, accessToken)
  {
    const proxyHeader = "NHSE-NRL-Pointer-URL";
    let proxyUrl = "https://sandbox-mhdpoctlsma-mhdpocbe.nhsdta.com/mhdspoc/FHIR/R4/DiagnosticReportLocal/" + reportId;
    let XRequestID = uuidv4();
    // request option
    let options = {
      host: "sandbox.api.service.nhs.uk",
      port: 443,
      method: 'GET',
      path: "/nhse-tsas-solarch-demo-api/mhdspoc/FHIR/R4/DiagnosticReportProxy",
      rejectUnauthorized: false,
      headers: {
        'Authorization': 'Bearer '+ accessToken,
        'accept': 'application/fhir+json;version=1',
        'x-request-id': XRequestID,
        'x-correlation-id': '11C46F5F-CDEF-4865-94B2-0EE0EDCC26DA',
        'nhsd-end-user-organisation-ods': ODSCode,
        "NHSE-NRL-Pointer-URL": proxyUrl
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

async function getAccessToken(){
  //console.log(apiClientPrivateKey);
  //let secretOrPrivateKey = createPrivateKey(apiClientPrivateKey);
  let blah = await createSignedJwtForAuth(OAuthAPIKey,
  "mhdtest001", apiClientPrivateKey,
  "sandbox.api.service.nhs.uk", "/oauth2/token");
  //console.log(blah);
  let blah2 = await getOAuth2AccessToken(blah, "sandbox.api.service.nhs.uk", "/oauth2/token");
  console.log(blah2);
  //load into JSON object
  let blah3 = JSON.parse(blah2);
  return blah3.access_token;
}
let accessToken = await getAccessToken();
console.log("got access token");

let result = await getReport(reportId, accessToken);
console.log(result);
