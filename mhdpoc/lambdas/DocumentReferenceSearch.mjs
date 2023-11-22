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

const S3BUCKET = process.env['S3BUCKET'];

export const handler = async (event) => {
  console.log(JSON.stringify(event));
    try {
        console.log(event.body);
        
        //get the documentReferenceId query parameter 
        const drid = event.queryStringParameters.identifier.replace("urn:oid:", "");
        //GET /asbestos/proxy/default__selftest_limited/DocumentManifest?identifier=urn:oid:1.2.10.0.2.15.2023.11.21.15.58.23.80.2&status=current&patient.identifier=urn:oid:1.3.6.1.4.1.21367.13.20.1000%7CIHERED-2654
        let key = "DocumentReference-"+drid;
        let params = {
          Key: key,
          Bucket: S3BUCKET,
        };

        let buf = await getS3Object(params);
        //convert the Buffer to a string
        let docRefString = buf.toString();
        console.log(docRefString);
        let docRef = JSON.parse(docRefString);
        let fullUrl = "https://" + event.headers.host + event.rawPath + "/" + docRef.id;

        let searchsetTemplate = {
          "resourceType": "Bundle",
          "type": "searchset",
          "total": 1,
          "link": [ {
            "relation": "self",
            "url": "https://" + event.headers.host + event.rawPath + "?" + event.rawQueryString
          } ],
          "entry": [ {
            "fullUrl": fullUrl,
            "resource": docRef,
            "search": {
              "mode": "match"
            }
          } ]
        };      


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