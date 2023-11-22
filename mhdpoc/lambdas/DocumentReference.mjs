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
        
        //get the documentid path parameter and put into template
        const documentid = event.pathParameters.documentid;
        let key = "DocumentReference-"+documentid;
        let params = {
          Key: key,
          Bucket: S3BUCKET,
        };

        let buf = await getS3Object(params);
        //convert the Buffer to a string
        let docRefString = buf.toString();
        console.log(docRefString);

        let DocumentReferenceTemplate = {
            "resourceType": "DocumentReference",
            "id": "e6a54bbc-95c0-4ea6-abc0-b97d25c9b426",
            "meta": {
              "profile": [ "http://ihe.net/fhir/StructureDefinition/IHE_MHD_Provide_Minimal_DocumentReference" ]
            },
            "masterIdentifier": {
              "system": "urn:ietf:rfc:3986",
              "value": "urn:oid:" + documentid
            },
            "identifier": [ {
              "use": "official",
              "system": "urn:ietf:rfc:3986",
              "value": "urn:uuid:e6a54bbc-95c0-4ea6-abc0-b97d25c9b426"
            } ],
            "status": "current",
            "subject": {
              "reference": "http://localhost:9760/asbestos/proxy/default__default/Patient/5"
            },
            "date": "2015-02-07T11:28:17.000+00:00",
            "content": [ {
              "attachment": {
                "contentType": "text/plain",
                "url": "https://main-mhdpoc-mhdpocbe.nhsdta.com/extapi/FHIR/R4/dummyfhirendpoint/Binary/" + documentid,
                "size": 6,
                "hash": "iEPX+SQWIR3p67lj/0zigSWTKHg="
              }
            } ]
          };      


        let response = {
            statusCode: 200,
            "headers": {
                "Content-Type": "application/fhir+json"
            },
            body: docRefString
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