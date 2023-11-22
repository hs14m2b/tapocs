import { CopyObjectCommand, DeleteObjectCommand, GetObjectCommand, HeadObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
const REGION = "eu-west-2";
const s3Client = new S3Client({
    apiVersion: '2006-03-01',
    region: REGION
});

const S3BUCKET = process.env['S3BUCKET'];
const MHD_3_MINIMAL_PROFILE = "http://ihe.net/fhir/StructureDefinition/IHE_MHD_Provide_Minimal_DocumentBundle";
const MHD_4_MINIMAL_PROFILE = "http://profiles.ihe.net/ITI/MHD/StructureDefinition/IHE.MHD.Minimal.ProvideBundle";

async function writeFile(body, bucket, key)
{
    let params = {
        "Body": body,
        "Bucket": bucket,
        "Key": key
    }
    const response = await s3Client
        .send(new PutObjectCommand(params))
    return response;
}

async function processmhd3(event, requestJson)
{
  //find identifier for DocumentReference
  let DRID = "";
  let DMID = "";
  let DOCID = "";
  let DocumentReferenceObject = {};
  let DocumentManifestObject = {};
  for (let entry of requestJson.entry) {
      if (entry.resource.resourceType == "DocumentReference")
      {
        DRID = entry.resource.masterIdentifier.value.replace("urn:oid:", "");
        let DRUUID = entry.fullUrl.replace("urn:uuid:", "");
        let DOCID = entry.resource.content[0].attachment.url.replace("urn:uuid:", "");
        DocumentReferenceObject = entry.resource;
        //add id
        DocumentReferenceObject["id"] = DRUUID;
        //add  identifier
        DocumentReferenceObject["identifier"] = [ {
          "use": "official",
          "system": "urn:ietf:rfc:3986",
          "value": "urn:uuid:" + DRUUID
        } ];
        //set content URL
        //https://main-mhdpoc-mhdpocbe.nhsdta.com/extapi/FHIR/R4/dummyfhirendpoint/Binary/
        DocumentReferenceObject.content[0].attachment.url = "https://main-mhdpoc-mhdpocbe.nhsdta.com/extapi/FHIR/R4/dummyfhirendpoint/Binary/"+DOCID;
        //save item to S3
        let body = JSON.stringify(DocumentReferenceObject);
        let key = "DocumentReference-urn:oid:"+DRID;
        let s3response = await writeFile(body, S3BUCKET, key);
        key = "DocumentReference-urn:uuid:"+DRUUID;
        s3response = await writeFile(body, S3BUCKET, key);
        console.log(JSON.stringify(s3response));
      }
      if (entry.resource.resourceType == "DocumentManifest") 
      {
        DMID = entry.resource.masterIdentifier.value.replace("urn:oid:", "");
        let DMUUID = entry.fullUrl.replace("urn:uuid:", "");
        let DMDRID = entry.resource.content[0].reference.replace("urn:uuid:", "");
        DocumentManifestObject = entry.resource;
        //add id
        DocumentManifestObject["id"] = DMUUID;
        //add  identifier
        DocumentManifestObject["identifier"] = [ {
          "use": "official",
          "system": "urn:ietf:rfc:3986",
          "value": "urn:uuid:" + DMUUID
        } ];
        //set content URL
        DocumentManifestObject.content[0].reference = "https://main-mhdpoc-mhdpocbe.nhsdta.com/extapi/FHIR/R4/dummyfhirendpoint/DocumentReference/"+DMDRID;
        //save item to S3
        let body = JSON.stringify(DocumentManifestObject);
        let key = "DocumentManifest-urn:oid:"+DMID;
        let s3response = await writeFile(body, S3BUCKET, key);
        key = "DocumentManifest-urn:uuid:"+DMUUID;
        s3response = await writeFile(body, S3BUCKET, key);
        console.log(JSON.stringify(s3response));
      }
  }

  let hardcodedresponse = {
      "resourceType": "Bundle",
      "type": "transaction-response",
      "entry": [ {
        "response": {
          "status": "201",
          "location": "https://main-mhdpoc-mhdpocbe.nhsdta.com/extapi/FHIR/R4/dummyfhirendpoint/DocumentReference/" + DRID
        }
      }, {
        "response": {
          "status": "201",
          "location": "https://main-mhdpoc-mhdpocbe.nhsdta.com/extapi/FHIR/R4/dummyfhirendpoint/DocumentManifest/" + DMID
        }
      }, {
        "response": {
          "status": "201",
          "location": "https://main-mhdpoc-mhdpocbe.nhsdta.com/extapi/FHIR/R4/dummyfhirendpoint/Binary/" + DRID
        }
      } ]
    };
    


  let response = {
      statusCode: 200,
      "headers": {
          "Content-Type": "application/fhir+json"
      },
      body: JSON.stringify(hardcodedresponse)
  };
  console.log(JSON.stringify(response));
  return response;
}

async function processmhd4(event, requestJson)
{
  //find identifier for DocumentReference
  let DRID = "";
  let LISTID = "";
  let DOCID = "";
  let DocumentReferenceObject = {};
  let ListObject = {};
  for (let entry of requestJson.entry) {
      if (entry.resource.resourceType == "DocumentReference")
      {
        DRID = entry.resource.masterIdentifier.value.replace("urn:oid:", "");
        let DRUUID = entry.fullUrl.replace("urn:uuid:", "");
        let DOCID = entry.resource.content[0].attachment.url.replace("urn:uuid:", "");
        DocumentReferenceObject = entry.resource;
        //add id
        DocumentReferenceObject["id"] = DRUUID;
        //add  identifier
        DocumentReferenceObject["identifier"] = [ {
          "use": "official",
          "system": "urn:ietf:rfc:3986",
          "value": "urn:uuid:" + DRUUID
        } ];
        //set content URL
        //https://main-mhdpoc-mhdpocbe.nhsdta.com/extapi/FHIR/R4/dummyfhirendpoint/Binary/
        DocumentReferenceObject.content[0].attachment.url = "https://main-mhdpoc-mhdpocbe.nhsdta.com/extapi/FHIR/R4/dummyfhirendpoint/Binary/"+DOCID;
        //save item to S3
        let body = JSON.stringify(DocumentReferenceObject);
        let key = "DocumentReference-urn:oid:"+DRID;
        let s3response = await writeFile(body, S3BUCKET, key);
        key = "DocumentReference-urn:uuid:"+DRUUID;
        s3response = await writeFile(body, S3BUCKET, key);
        console.log(JSON.stringify(s3response));
      }
      if (entry.resource.resourceType == "List") 
      {
        for (let identifier of entry.resource.identifier){
          if (identifier.value){
            LISTID = identifier.value.replace("urn:oid:", "");
            break;
          }
        }
        let LISTUUID = entry.fullUrl.replace("urn:uuid:", "");
        let LISTDRID = entry.resource.entry[0].item.reference.replace("urn:uuid:", "");
        ListObject = entry.resource;
        //add id
        ListObject["id"] = LISTUUID;
        //set content URL
        ListObject.entry[0].item.reference = "https://main-mhdpoc-mhdpocbe.nhsdta.com/extapi/FHIR/R4/dummyfhirendpoint/DocumentReference/"+LISTDRID;
        //save item to S3
        let body = JSON.stringify(ListObject);
        let key = "List-urn:oid:"+LISTID;
        let s3response = await writeFile(body, S3BUCKET, key);
        key = "List-urn:uuid:"+LISTUUID;
        s3response = await writeFile(body, S3BUCKET, key);
        console.log(JSON.stringify(s3response));
      }
  }

  let hardcodedresponse = {
      "resourceType": "Bundle",
      "type": "transaction-response",
      "entry": [ {
        "response": {
          "status": "201",
          "location": "https://main-mhdpoc-mhdpocbe.nhsdta.com/extapi/FHIR/R4/dummyfhirendpoint/DocumentReference/" + DRID
        }
      }, {
        "response": {
          "status": "201",
          "location": "https://main-mhdpoc-mhdpocbe.nhsdta.com/extapi/FHIR/R4/dummyfhirendpoint/List/" + LISTID
        }
      }, {
        "response": {
          "status": "201",
          "location": "https://main-mhdpoc-mhdpocbe.nhsdta.com/extapi/FHIR/R4/dummyfhirendpoint/Binary/" + DRID
        }
      } ]
    };
    


  let response = {
      statusCode: 200,
      "headers": {
          "Content-Type": "application/fhir+json"
      },
      body: JSON.stringify(hardcodedresponse)
  };
  console.log(JSON.stringify(response));
  return response;
}

export const handler = async (event) => {
  console.log(JSON.stringify(event));
    try {
        console.log(event.body);
        
        const plain = Buffer.from(event.body, 'base64').toString('utf8');
        const requestJson = JSON.parse(plain);
        console.log(JSON.stringify(requestJson));

        //check bundle profile
        const bundleprofile = requestJson.meta.profile[0];
        console.log("profile of bundle is " + bundleprofile);
        if (bundleprofile == MHD_3_MINIMAL_PROFILE) return await processmhd3(event, requestJson);
        if (bundleprofile == MHD_4_MINIMAL_PROFILE) return await processmhd4(event, requestJson);
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