import { CopyObjectCommand, DeleteObjectCommand, GetObjectCommand, HeadObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';

import { getDocRef } from './get_document_ref.mjs'
import { searchResourceWithRetry } from './search_resource_healthlake.mjs';

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

async function searchHealthlake(event){
  let maxDuration=25000;
  try {
    console.log("searching healthlake")
    let healthlakeresponse = await searchResourceWithRetry(maxDuration,event.queryStringParameters, "DocumentReference", "Y05868", APIENVIRONMENT, APIKEYSECRET, APIKNAMEPARAM);
    console.log("healthlake response is " + JSON.stringify(healthlakeresponse));
    let searchsetBundle = JSON.parse(healthlakeresponse.body);
    if (searchsetBundle.entry) searchsetBundle.total = searchsetBundle.entry.length;
    return searchsetBundle;
  } catch (error) {
    console.log(error);
    return false;
  }
}




export const handler = async (event) => {
  console.log(JSON.stringify(event));
    try {
        console.log(event.body);

        //try healthlake
        try {
          let searchsetBundle = await searchHealthlake(event);
          if (searchsetBundle){
            //return the searchset
            let healthlakeResponse = {
              statusCode: 200,
              "headers": {
                  "Content-Type": "application/fhir+json"
              },
              body: JSON.stringify(searchsetBundle)
            };
            console.log(JSON.stringify(healthlakeResponse));
            return healthlakeResponse;
          }
        } catch (error) {
          console.log("caught an unexpected error processing data from healthlake");
          throw error;
        }
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
