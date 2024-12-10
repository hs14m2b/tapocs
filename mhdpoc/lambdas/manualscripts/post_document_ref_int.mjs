import { createSignedJwtForAuth, getOAuth2AccessToken } from '../api_common_functions.mjs';

import { readFileSync } from 'node:fs';

const apiClientPrivateKey = readFileSync('../../certs/mhdtest001.key', 'utf8');

import { URLSearchParams } from 'url';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
const { sign } = jwt;
const HTTPS = "https://";
const ODSCode = "X26";
const OAuthAPIKey = "kqU7ldmK4wVoDQA6c76bNsAFMzw8SmGQ";

let https;
try {
  https = await import('node:https');
} catch (err) {
  console.log('https support is disabled!');
}
let newId = "00000000-make-unique-for-sandbox-requestdddef";//uuidv4(); //Y05868-70bce845-679e-42ea-a909-30ac78ec1956
console.log(newId);
let example = {
  "resourceType": "DocumentReference",
  "status": "current",
  "docStatus": "final",
  "type": {
    "coding": [
      {
        "system": "http://snomed.info/sct",
        "code": "736253002",
        "display": "Mental health crisis plan"
      }
    ]
  },
  "category": [
    {
      "coding": [
        {
          "system": "http://snomed.info/sct",
          "code": "734163000",
          "display": "Care plan"
        }
      ]
    }
  ],
  "subject": {
    "identifier": {
      "system": "https://fhir.nhs.uk/Id/nhs-number",
      "value": "6700028191"
    }
  },
  "author": [
    {
      "identifier": {
        "system": "https://fhir.nhs.uk/Id/ods-organization-code",
        "value": ODSCode
      }
    }
  ],
  "custodian": {
    "identifier": {
      "system": "https://fhir.nhs.uk/Id/ods-organization-code",
      "value": ODSCode
    }
  },
  "description": "Physical document mental health crisis plan",
  "securityLabel": [
    {
      "coding": [
        {
          "system": "http://terminology.hl7.org/CodeSystem/v3-Confidentiality",
          "code": "V",
          "display": "very restricted"
        }
      ]
    }
  ],
  "content": [
    {
      "attachment": {
        "contentType": "application/pdf",
        "language": "en-US",
        "url": "https://int-mhdpoctlsma-mhdpocbe.nhsdta.com/mhdspoc/FHIR/R4/DiagnosticReportLocal/UNIQUEIDFORREPORT-1e404af3-077f-4bee-b7a6-a9be97e1ce01",
        "size": 3654,
        "hash": "2jmj7l5rSw0yVb/vlWAYkK/YBwk=",
        "title": "Mental health crisis plan report",
        "creation": "2022-12-21T10:45:41+11:00"
      },
      "format": {
        "system": "https://fhir.nhs.uk/England/CodeSystem/England-NRLFormatCode",
        "code": "urn:nhs-ic:unstructured",
        "display": "Unstructured document"
      }
    }
  ],
  "context": {
    "practiceSetting": {
      "coding": [
        {
          "system": "http://snomed.info/sct",
          "code": "788002001",
          "display": "Adult mental health service"
        }
      ]
    },
    "sourcePatientInfo": {
      "identifier": {
        "system": "https://fhir.nhs.uk/Id/nhs-number",
        "value": "6700028191"
      }
    },
    "related": [
      {
        "identifier": {
          "system": "https://fhir.nhs.uk/Id/nhsSpineASID",
          "value": "012345678910"
        }
      }
    ]
  }
};


async function sendDocRef (docRef, accessToken)
  {
    let postString = JSON.stringify(docRef);
    let datalength = postString.length
    let XRequestID = uuidv4();
    // request option
    let options = {
      host: "int.api.service.nhs.uk",
      port: 443,
      method: 'POST',
      path: "/record-locator/producer/FHIR/R4/DocumentReference",
      rejectUnauthorized: false,
      headers: {
        'Authorization': 'Bearer '+ accessToken,
        'accept': 'application/fhir+json;version=1',
        'x-request-id': XRequestID,
        'x-correlation-id': '11C46F5F-CDEF-4865-94B2-0EE0EDCC26DA',
        'nhsd-end-user-organisation-ods': ODSCode,
        'content-type': 'application/fhir+json;version=1',
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
  "int.api.service.nhs.uk", "/oauth2/token");
  //console.log(blah);
  let blah2 = await getOAuth2AccessToken(blah, "int.api.service.nhs.uk", "/oauth2/token");
  console.log(blah2);
  //load into JSON object
  let blah3 = JSON.parse(blah2);
  return blah3.access_token;
}
let accessToken = await getAccessToken();
console.log("got access token");
let result = await sendDocRef(example, accessToken);
console.log(result);
