import { URLSearchParams } from 'url';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
const { sign } = jwt;
const HTTPS = "https://";

let https;
try {
  https = await import('node:https');
} catch (err) {
  console.log('https support is disabled!');
}
let newId = uuidv4(); //Y05868-70bce845-679e-42ea-a909-30ac78ec1956
console.log(newId);
let example = {
    "resourceType": "DocumentReference",
    "id": "Y05868-" + newId,
    "meta": {
      "profile": [
        "http://fhir.nhs.net/StructureDefinition/nrls-documentreference-1-0"
      ]
    },
    "masterIdentifier": {
      "system": "urn:ietf:rfc:3986",
      "value": "urn:oid:1.3.6.1.4.1.21367.2005.9.0"
    },
    "identifier": [
      {
        "system": "urn:ietf:rfc:3986",
        "value": "urn:oid:1.3.6.1.4.1.21367.2005.3.7.1330"
      }
    ],
    "status": "current",
    "docStatus": "final",
    "type": {
      "coding": [
        {
          "system": "http://snomed.info/sct",
          "code": "736253002",
          "display": "Mental Health Crisis Plan"
        }
      ]
    },
    "category": [
      {
        "coding": [
          {
            "system": "http://loinc.org",
            "code": "55112-7",
            "display": "Document summary"
          }
        ]
      }
    ],
    "subject": {
      "identifier": {
        "system": "https://fhir.nhs.uk/Id/nhs-number",
        "value": "4409815415"
      }
    },
    "date": "2022-12-21T10:45:41+11:00",
    "author": [
      {
        "identifier": {
          "value": "Practitioner/A985657ZA"
        }
      }
    ],
    "authenticator": {
      "identifier": {
        "value": "Organization/Y05868"
      }
    },
    "custodian": {
      "identifier": {
        "system": "https://fhir.nhs.uk/Id/ods-organization-code",
        "value": "Y05868"
      }
    },
    "description": "Physical",
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
          "url": "https://spine-proxy.national.ncrs.nhs.uk/p1.nhs.uk/EPAACS/MHCPummaryReport.pdf",
          "size": 3654,
          "hash": "2jmj7l5rSw0yVb/vlWAYkK/YBwk=",
          "title": "Physical",
          "creation": "2022-12-21T10:45:41+11:00"
        },
        "format": {
          "system": "urn:oid:1.3.6.1.4.1.19376.1.2.3",
          "code": "urn:ihe:pcc:cm:2008",
          "display": "History and Physical Specification"
        }
      }
    ],
    "context": {
      "encounter": [
        {
          "identifier": {
            "value": "Encounter/4409815415"
          }
        }
      ],
      "event": [
        {
          "coding": [
            {
              "system": "http://snomed.info/sct",
              "code": "736253002",
              "display": "Mental Health Crisis Plan"
            }
          ]
        }
      ],
      "period": {
        "start": "2022-12-21T09:00:41+11:00",
        "end": "2022-12-21T10:45:41+11:00"
      },
      "facilityType": {
        "coding": [
          {
            "system": "http://snomed.info/sct",
            "code": "73770003",
            "display": "Mental health caregiver support"
          }
        ]
      },
      "practiceSetting": {
        "coding": [
          {
            "system": "http://snomed.info/sct",
            "code": "390826005",
            "display": "Mental health caregiver support"
          }
        ]
      },
      "sourcePatientInfo": {
        "identifier": {
          "value": "Patient/4409815415"
        }
      },
      "related": [
        {
          "identifier": {
            "system": "https://fhir.nhs.uk/Id/ods-organization-code",
            "value": "MENTAL HEALTH OUTREACH"
          }
        }
      ]
    }
  };

 
async function sendDocRef (docRef) 
  {
    let postString = JSON.stringify(docRef);
    let datalength = postString.length
    let XRequestID = uuidv4();
    // request option
    let options = {
      host: "sandbox.api.service.nhs.uk",
      port: 443,
      method: 'POST',
      path: "/record-locator/producer/FHIR/R4/DocumentReference",
      rejectUnauthorized: false,
      headers: {
        //'Authorization': 'Bearer '+ access_token,
        'accept': 'application/fhir+json;version=1',
        'X-Request-ID': XRequestID,
        'NHSD-End-User-Organisation-ODS': 'Y05868',
        'Content-Type': 'application/fhir+json;version=1',
        'Content-Length': datalength
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
         
        //send request with the postString json
        req.write(postString);
        req.end();
    });
  }

let result = await sendDocRef(example);
console.log(result);