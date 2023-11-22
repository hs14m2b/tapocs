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
        
        //get the dmid path parameter and put into template
        const dmid = event.pathParameters.dmid;
        let key = "DocumentManifest-urn:uuid:"+dmid;
        let params = {
          Key: key,
          Bucket: S3BUCKET,
        };

        let buf;
        try {
          buf = await getS3Object(params);
        } catch (error) {
          key = "DocumentManifest-urn:oid:"+dmid;
          params = {
            Key: key,
            Bucket: S3BUCKET,
          };
          buf = await getS3Object(params);
        }
        //convert the Buffer to a string
        let docManString = buf.toString();
        console.log(docManString);
        let docMan = JSON.parse(docManString);
        let fullUrl = "https://" + event.headers.host + event.rawPath + "/" + docMan.id;

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
            "resource": docMan,
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