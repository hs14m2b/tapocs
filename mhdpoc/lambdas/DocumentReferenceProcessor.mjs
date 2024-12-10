import { CopyObjectCommand, DeleteObjectCommand, GetObjectCommand, HeadObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';

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

export const handler = async (event, get_document_ref_object_instance, getParameterCaseInsensitive, APIENVIRONMENT, APIKEYSECRET, APIKNAMEPARAM) => {
  console.log(JSON.stringify(event));
    try {
        //get the documentid path parameter and put into template
        const documentid = event.pathParameters.documentid;

        //get the ODS code from the header
        let odscode = getParameterCaseInsensitive(event.headers, 'NHSD-End-User-Organisation-ODS');
        if (odscode === undefined && APIENVIRONMENT === "sandbox") {
          odscode = "Y05868";
        }

        console.log("getting doc from NRL");
        let nrlresponse = await get_document_ref_object_instance.getDocRef(documentid, odscode, APIENVIRONMENT, APIKEYSECRET, APIKNAMEPARAM);
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
