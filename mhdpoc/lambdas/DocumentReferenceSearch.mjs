import { CopyObjectCommand, DeleteObjectCommand, GetObjectCommand, HeadObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';

import { getDocRef } from './get_document_ref_sandpit.mjs'

const REGION = "eu-west-2";
const s3Client = new S3Client({
    apiVersion: '2006-03-01',
    region: REGION
});

async function getS3Object(params) {
  const response = await s3Client
      .send(new GetObjectCommand(params))
  const stream = response.Body;

  return new Promise((resolve, reject) => {
      const chunks = []
      stream.on('data', chunk => { console.log("received a chunk"); chunks.push(chunk) })
      stream.on('end', () => resolve(Buffer.concat(chunks)))
      stream.on('error', err => reject(err))
  });
  // if readable.toArray() is support
  // return Buffer.concat(await stream.toArray())
}

const S3BUCKET = process.env['S3BUCKET'];

export const handler = async (event) => {
  console.log(JSON.stringify(event));
    try {
        console.log(event.body);
        
        //get the documentReferenceId query parameter 
        const drid = event.queryStringParameters.identifier;
        let key = "DocumentReference-"+drid;
        let params = {
          Key: key,
          Bucket: S3BUCKET,
        };
        let searchsetTemplate = {
          "resourceType": "Bundle",
          "type": "searchset",
          "total": 0,
          "link": [ {
            "relation": "self",
            "url": "https://" + event.headers.host + event.rawPath + "?" + event.rawQueryString
          } ],
          "entry": [  ]
        };      

        try {
          let buf = await getS3Object(params);
          //convert the Buffer to a string
          let docRefString = buf.toString();
          console.log(docRefString);
          let docRef = JSON.parse(docRefString);
          let fullUrl = "https://" + event.headers.host + event.rawPath + "/" + docRef.id;
          let NRLParams = {
            "subject": {
              "identifier": {
                "system": "https://fhir.nhs.uk/Id/nhs-number",
                "value": "4409815415"
              }
            },
            "type": {
              "coding": [
                {
                  "system": "http://snomed.info/sct",
                  "code": "736253002",
                  "display": "Mental Health Crisis Plan"
                }
              ]
            },
            "custodian": {
              "identifier": {
                "system": "https://fhir.nhs.uk/Id/ods-organization-code",
                "value": "Y05868"
              }
            }
          }
          let nrlDocRefId = (docRef.id.startsWith(NRLParams.custodian.identifier.value)) ? docRef.id : NRLParams.custodian.identifier.value + "-" + docRef.id; 
          let nrlresponse = await getDocRef(nrlDocRefId);
          let nrlDocRef = JSON.parse(nrlresponse.body);
          console.log(nrlresponse);
          let searchsetEntry = {
              "fullUrl": fullUrl,
              "resource": nrlDocRef,
              "search": {
                "mode": "match"
              }
          };
          searchsetTemplate.entry.push(searchsetEntry);
          searchsetTemplate.total = 1;   
        } catch (error) {
          console.log("unable to find any DocumentReference objects");
        }


        let response = {
            statusCode: 200,
            "headers": {
                "Content-Type": "application/fhir+json"
            },
            body: JSON.stringify(searchsetTemplate)
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