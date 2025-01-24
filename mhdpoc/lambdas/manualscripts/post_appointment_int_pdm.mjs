import { createSignedJwtForAuth, getOAuth2AccessToken } from '../api_common_functions.mjs';

import { readFileSync } from 'node:fs';

const apiClientPrivateKey = readFileSync('../../certs/mhdtest001.key', 'utf8');

import { URLSearchParams } from 'url';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
const { sign } = jwt;
const HTTPS = "https://";
const ODSCode = "X26";
const OAuthAPIKey = "lozLikGglL1AHTqwL2LVGZnLAsIj7YVE"; //key for tsas-solarch-demo-app-pdm

let https;
try {
  https = await import('node:https');
} catch (err) {
  console.log('https support is disabled!');
}
let newId = "00000000-make-unique-for-sandbox-requestdddef";//uuidv4(); //Y05868-70bce845-679e-42ea-a909-30ac78ec1956
console.log(newId);
let example = {
  "resourceType": "Appointment",
  "status": "cancelled",
  "description": "NUCLEAR MEDICINE - Update 2",
  "start": "2012-01-18T13:22:41+00:00",
  "end": "2012-01-18T14:20:41+00:00",
  "extension": [
      {
          "url": "https://fhir.nhs.uk/StructureDefinition/Extension-ServiceRequest-Priority",
          "valueCoding": {
              "system": "https://fhir.nhs.uk/CodeSystem/eRS-Priority",
              "code": "URGENT"
          }
      },
      {
          "url": "https://fhir.nhs.uk/StructureDefinition/Extension-Consultation-Medium",
          "valueCode": "VIRTUAL"
      }
  ],
  "basedOn": [
      {
          "identifier": {
              "system": "https://fhir.nhs.uk/Id/UBRN",
              "value": "836753519353"
          }
      }
  ],
  "participant": [
      {
          "actor": {
              "type": "Patient",
              "identifier": {
                  "system": "https://fhir.nhs.uk/Id/nhs-number",
                  "value": "9999900702"
              }
          },
          "status": "accepted"
      },
      {
          "actor": {
              "type": "HealthcareService",
              "identifier": {
                  "system": "https://fhir.nhs.uk/Id/ods-organization-code",
                  "value": "RHW"
              }
          },
          "status": "accepted"
      },
      {
          "actor": {
              "type": "Practitioner",
              "identifier": {
                  "system": "https://fhir.nhs.uk/Id/sds-user-id",
                  "value": "G4022126"
              }
          },
          "status": "accepted"
      },
      {
          "actor": {
              "type": "Location",
              "display": "R0B01"
          },
          "status": "accepted"
      }
  ]
};


async function sendAppointment (appointment, accessToken)
  {
    //https://internal-qa.api.service.nhs.uk/patient-data-manager/FHIR/R4/
    let postString = JSON.stringify(appointment);
    let datalength = postString.length
    let XRequestID = uuidv4();
    // request option
    let options = {
      host: "internal-qa.api.service.nhs.uk",
      port: 443,
      method: 'POST',
      path: "/patient-data-manager/FHIR/R4/Appointment",
      rejectUnauthorized: false,
      headers: {
        'Authorization': 'Bearer '+ accessToken,
        'accept': 'application/fhir+json',
        'x-request-id': XRequestID,
        'x-correlation-id': '11C46F5F-CDEF-4865-94B2-0EE0EDCC26DA',
        'NHSE-Product-ID' : '1125b78d-0702-4a90-9918-14c1c23cf7a3',//'test-product-full-access',
        'nhsd-end-user-organisation-ods': ODSCode,
        'content-type': 'application/fhir+json',
        'content-length': datalength
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
                  "headers": res.headers,
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

        //send request with the postString json
        req.write(postString);
        req.end();
    });
}

async function getAccessToken(){
  //console.log(apiClientPrivateKey);
  //let secretOrPrivateKey = createPrivateKey(apiClientPrivateKey);
  let blah = await createSignedJwtForAuth(OAuthAPIKey,
  "mhdtest001", apiClientPrivateKey,
  "internal-qa.api.service.nhs.uk", "/oauth2/token");
  //console.log(blah);
  let blah2 = await getOAuth2AccessToken(blah, "internal-qa.api.service.nhs.uk", "/oauth2/token");
  console.log(blah2);
  //load into JSON object
  let blah3 = JSON.parse(blah2);
  return blah3.access_token;
}
let accessToken = await getAccessToken();
console.log("got access token");
let result = await sendAppointment(example, accessToken);
console.log(result);
