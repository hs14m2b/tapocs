import { CopyObjectCommand, DeleteObjectCommand, GetObjectCommand, HeadObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';

import { getDocRef } from './get_document_ref.mjs'

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

const APIKEYSECRET = process.env['APIKEYSECRET'];
const APIENVIRONMENT = process.env['APIENVIRONMENT'];
const APIKNAMEPARAM = process.env['APIKNAMEPARAM'];

export const handler = async (event) => {
  console.log(JSON.stringify(event));
    try {
        console.log(event.body);

        //get the documentid path parameter and put into template
        const documentid = event.pathParameters.documentid;

        console.log("getting doc from NRL");
        let nrlresponse = await getDocRef(documentid, APIENVIRONMENT, APIKEYSECRET, APIKNAMEPARAM);
        console.log(nrlresponse);


        let response = {
            statusCode: 200,
            "headers": {
                "Content-Type": "application/fhir+json"
            },
            body: nrlresponse.body
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
