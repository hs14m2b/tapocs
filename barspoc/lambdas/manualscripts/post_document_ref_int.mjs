import { createSignedJwtForAuth, getOAuth2AccessToken } from '../api_common_functions.mjs';

import { readFileSync } from 'node:fs';

const apiClientPrivateKey = readFileSync('../../certs/mhdtest001.key', 'utf8');

import { URLSearchParams } from 'url';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
const { sign } = jwt;
const HTTPS = "https://";
const ODSCode = "X26";
const OAuthAPIKey = "JE4ESpy5NzFyG5n4U6pKqk8HGXeRjLhZ"; //API Key for BaRS Demonstrator

let https;
try {
  https = await import('node:https');
} catch (err) {
  console.log('https support is disabled!');
}
let newId = "X26-4a3836f5-2d42-4d3e-87c1-680173b7fa5c";//uuidv4(); //Y05868-70bce845-679e-42ea-a909-30ac78ec1956
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

let example2 = {
  "resourceType": "DocumentReference",
  "id": "X26-4a3836f5-2d42-4d3e-87c1-680173b7fa5c",
  "masterIdentifier": [
    {
      "system": "urn:ietf:rfc:3986",
      "value": "urn:uuid:27e2b1c8-ecd8-48f8-9958-8e614cc7ad73"
    }
  ],
  "identifier": [
    {
      "system": "https://fhir.nhs.uk/Id/BaRS-Identifier",
      "value": "4a3836f5-2d42-4d3e-87c1-680173b7fa5c"
    },
    {
      "system": "https://fhir.nhs.uk/Id/dos-service-id",
      "value": "matthewbrown"
    },
    {
      "system": "https://fhir.nhs.uk/id/product-id",
      "value": "6a5fc9f4-4af4-4819-b5d1-1339d9b64295"
    }
  ],
  "status": "current",
  "type": {
    "coding": [
      {
        "system": "http://snomed.info/sct",
        "code": "749001000000101",
        "display": "Appointment (record artifact)"
      }
    ]
  },
  "category": [
    {
      "coding": [
        {
          "system": "http://snomed.info/sct",
          "code": "419891008",
          "display": "Record Artifact"
        }
      ]
    }
  ],
  "subject": {
    "identifier": {
      "system": "https://fhir.nhs.uk/Id/nhs-number",
      "value": "9876543210"
    }
  },
  "custodian": {
    "identifier": {
      "system": "https://fhir.nhs.uk/Id/ods-organization-code",
      "value": "X26",
      "display": "NHS ENGLAND - X26"
    }
  },
  "content": [
    {
      "attachment": {
        "contentType": "application/fhir+json",
        "language": "en-UK",
        "url": "https://bars-int-x26.tsassolarch.thirdparty.nhs.uk/barspoc/FHIR/R4/Appointment/4a3836f5-2d42-4d3e-87c1-680173b7fa5c"
      },
      "format": {
        "system": "https://fhir.nhs.uk/CodeSystem/message-events-bars",
        "code": "booking-request",
        "display": "Booking Request - Request"
      }
    }
  ],
  "context": {
    "period": {
      "start": "2025-01-15T09:50:00Z",
      "end": "2025-01-15T10:00:00Z"
    },
    "practiceSetting": {
      "coding": [
        {
          "system": "http://snomed.info/sct",
          "code": "394802001",
          "display": "General medicine (qualifier value)"
        }
      ]
    }
  }
}

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
        'NHSD-End-User-Organisation-ODS': ODSCode,//'ewrCoCAicmVzb3VyY2VUeXBlIjogIk9yZ2FuaXphdGlvbiIsCsKgICJpZGVudGlmaWVyIjogW wrCoCDCoCB7CsKgIMKgIMKgICJodHRwczovL2ZoaXIubmhzLnVrL0lkL29kcy1vcmdhbml6YXRpb24tY29kZSIsCsKgIMK gIMKgICJ2YWx1ZSI6ICJYMjYiCgoKwqAgwqAgfSwKwqAgIm5hbWUiOiAiTkhTIEVOR0xBTkQgLSBYMjYiCsKgIF0KfQ==',
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
