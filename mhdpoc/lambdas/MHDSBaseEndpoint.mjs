import { CopyObjectCommand, DeleteObjectCommand, GetObjectCommand, HeadObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';

import { deleteDocRef } from './delete_document_ref.mjs';
import { sendDocRef } from './post_document_ref.mjs';
import { v4 as uuidv4 } from 'uuid';
import { gunzipSync } from 'zlib';

const REGION = "eu-west-2";
const s3Client = new S3Client({
    apiVersion: '2006-03-01',
    region: REGION
});

const S3BUCKET = process.env['S3BUCKET'];
const APIENVIRONMENT = process.env['APIENVIRONMENT'];
const APIKEYSECRET = process.env['APIKEYSECRET'];
const APIKEY = process.env['APIKEY'];
const MHD_3_MINIMAL_PROFILE = "ihe.net/fhir/StructureDefinition/IHE_MHD_Provide_Minimal_DocumentBundle";
const MHD_3_COMPREHENSIVE_PROFILE = "ihe.net/fhir/StructureDefinition/IHE_MHD_Provide_Comprehensive_DocumentBundle";
const MHD_4_MINIMAL_PROFILE = "profiles.ihe.net/ITI/MHD/StructureDefinition/IHE.MHD.Minimal.ProvideBundle";
const MHD_4_COMPREHENSIVE_PROFILE = "profiles.ihe.net/ITI/MHD/StructureDefinition/IHE.MHD.Comprehensive.ProvideBundle";
const MHD_4_COMPREHENSIVE_UNCONTAINED_PROFILE = "profiles.ihe.net/ITI/MHD/StructureDefinition/IHE.MHD.UnContained.Comprehensive.ProvideBundle";

//hard coded endpoint values
const DIRECT_ENDPOINT = "https://" + APIENVIRONMENT + "-mhdpoc-mhdpocbe.nhsdta.com/mhdspoc/FHIR/R4/";
const APIM_ENDPOINT = "https://" + APIENVIRONMENT + ".api.service.nhs.uk/nhse-tsas-solarch-demo-api/mhdspoc/FHIR/R4/"


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

async function processmhd3(event, requestJson, targetEndpoint)
{
  let issue = validatemhd(requestJson);
  if (issue.length > 0)
  {
    console.log("issues detected in validating submission");
    console.log(JSON.stringify(issue));
    let operationOutcome = {
      "resourceType": "OperationOutcome",
      "issue": issue
    }
    let errorResponse = {
      statusCode: 400,
      "headers": {
          "Content-Type": "application/fhir+json"
      },
      body: JSON.stringify(operationOutcome)
    };
    return errorResponse;
  }
  let responseTemplate = {
    "resourceType": "Bundle",
    "type": "transaction-response",
    "entry": [ ]
  };
  let entryTemplate = {
    "response": {
      "status": "201",
      "location": ""
    }
  };
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
      entryTemplate.response.location = targetEndpoint + "DocumentReference/" + DRID;
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
      //https://main-mhdpoc-mhdpocbe.nhsdta.com/extapi/FHIR/R4/Binary/
      DocumentReferenceObject.content[0].attachment.url = targetEndpoint + "Binary/"+DOCID;
      //check if the DocumentReference replaces another one
      if (DocumentReferenceObject.relatesTo && DocumentReferenceObject.relatesTo.length > 0)
      {
        if (DocumentReferenceObject.relatesTo[0].code == "replaces")
        {
          console.log("this reference replaces another one");
          for (let relatesTo of DocumentReferenceObject.relatesTo)
          {
            let code = relatesTo.code;
            let targetReference = relatesTo.target.reference;
            let targetId = targetReference.substring(targetReference.lastIndexOf("/")+1);
            console.log("target id is " + targetId);
            //get the object from S3
            let supersededDocumentReference = JSON.parse(await getDocumentReference(targetId));
            supersededDocumentReference.status = "superseded";
            let SDRUUID = supersededDocumentReference.id;
            let SDRID = supersededDocumentReference.masterIdentifier.value.replace("urn:oid:", "");
            //overwrite superseded objects
            let skey = "DocumentReference-urn:oid:"+SDRID;
            let ss3response = await writeFile(JSON.stringify(supersededDocumentReference), S3BUCKET, skey);
            skey = "DocumentReference-urn:uuid:"+SDRUUID;
            ss3response = await writeFile(JSON.stringify(supersededDocumentReference), S3BUCKET, skey);
            console.log(JSON.stringify(ss3response));
          }
        }
        else if (DocumentReferenceObject.relatesTo[0].code == "transforms")
        {
          //nothing specific needed here as the original document has been transformed in-situ
          delete DocumentReferenceObject.relatesTo;
        }
        else if (DocumentReferenceObject.relatesTo[0].code == "appends")
        {
          //nothing specific needed here as the original document has been transformed in-situ
          delete DocumentReferenceObject.relatesTo;
        }
      }
      //save item to S3
      let body = JSON.stringify(DocumentReferenceObject);
      let key = "DocumentReference-urn:oid:"+DRID;
      let s3response = await writeFile(body, S3BUCKET, key);
      key = "DocumentReference-urn:uuid:"+DRUUID;
      s3response = await writeFile(body, S3BUCKET, key);
      console.log(JSON.stringify(s3response));
      responseTemplate.entry.push(JSON.parse(JSON.stringify(entryTemplate)));
    }
    if (entry.resource.resourceType == "DocumentManifest") 
    {
      DMID = entry.resource.masterIdentifier.value.replace("urn:oid:", "");
      entryTemplate.response.location = targetEndpoint + "DocumentManifest/" + DMID;
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
      DocumentManifestObject.content[0].reference = targetEndpoint + "DocumentReference/"+DMDRID;
      //save item to S3
      let body = JSON.stringify(DocumentManifestObject);
      let key = "DocumentManifest-urn:oid:"+DMID;
      let s3response = await writeFile(body, S3BUCKET, key);
      key = "DocumentManifest-urn:uuid:"+DMUUID;
      s3response = await writeFile(body, S3BUCKET, key);
      console.log(JSON.stringify(s3response));
      responseTemplate.entry.push(JSON.parse(JSON.stringify(entryTemplate)));
    }
    if (entry.resource.resourceType == "Binary"){
      entryTemplate.response.location = targetEndpoint + "Binary/" + entry.fullUrl.replace("urn:uuid:", "");
      responseTemplate.entry.push(JSON.parse(JSON.stringify(entryTemplate)));
    }
  }

  let response = {
      statusCode: 200,
      "headers": {
          "Content-Type": "application/fhir+json"
      },
      body: JSON.stringify(responseTemplate)
  };
  console.log(JSON.stringify(response));
  return response;
}

async function processmhd4(event, requestJson, targetEndpoint)
{
  let issue = validatemhd(requestJson);
  if (issue.length > 0)
  {
    console.log("issues detected in validating submission");
    console.log(JSON.stringify(issue));
    let operationOutcome = {
      "resourceType": "OperationOutcome",
      "issue": issue
    }
    let errorResponse = {
      statusCode: 400,
      "headers": {
          "Content-Type": "application/fhir+json"
      },
      body: JSON.stringify(operationOutcome)
    };
    return errorResponse;
  }
  //find identifier for DocumentReference
  console.log("validated the request OK");
  let responseTemplate = {
    "resourceType": "Bundle",
    "type": "transaction-response",
    "entry": [ ]
  };
  let entryTemplate = {
    "response": {
      "status": "201",
      "location": ""
    }
  };
  let DRMASTERID = "";
  let LISTID = "";
  //let DOCID = "";
  let DocumentReferenceObject = {};
  let ListObject = {};
  for (let entry of requestJson.entry) {
      if (entry.resource.resourceType == "DocumentReference")
      {
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
          "custodian": {
            "identifier": {
              "system": "https://fhir.nhs.uk/Id/ods-organization-code",
              "value": "Y05868"
            }
          }
        }
        let resourceNewId = NRLParams.custodian.identifier.value + "-" + uuidv4();
        DRMASTERID = entry.resource.masterIdentifier.value.replace("urn:oid:", "");
        let DRUUID = entry.fullUrl.replace("urn:uuid:", "");
        //let DOCID = entry.resource.content[0].attachment.url.replace("urn:uuid:", "");
        DocumentReferenceObject = entry.resource;
        //add id if not present
        //if (!DocumentReferenceObject.id)
        //{
        //  console.log("setting the id...");
        //  DocumentReferenceObject["id"] = resourceNewId;
        //}
        //add  identifier
        //DocumentReferenceObject["identifier"] = [ {
        //  "use": "official",
        //  "system": "urn:ietf:rfc:3986",
        //  "value": "urn:uuid:" + DRUUID
        //} ];
        //set content URL
        //https://main-mhdpoc-mhdpocbe.nhsdta.com/extapi/FHIR/R4/Binary/
        //DocumentReferenceObject.content[0].attachment.url = "https://main-mhdpoc-mhdpocbe.nhsdta.com/extapi/FHIR/R4/Binary/"+DOCID;
        //check if the DocumentReference replaces another one
        if (DocumentReferenceObject.relatesTo && DocumentReferenceObject.relatesTo.length > 0)
        {
          if (DocumentReferenceObject.relatesTo[0].code == "replaces")
          {
            console.log("this reference replaces another one");
            for (let relatesTo of DocumentReferenceObject.relatesTo)
            {
              //nothing specific needed here as NRL manages this
              let code = relatesTo.code;
              let targetReference = relatesTo.target.reference;
              let targetId = targetReference.substring(targetReference.lastIndexOf("/")+1);
              console.log("target id is " + targetId);
              try {
                if (relatesTo.target.identifier && relatesTo.target.identifier.value && relatesTo.target.identifier.value.startsWith("DocumentReference"))
                {
                  console.log("replacing the target identifier value");
                  relatesTo.target.identifier.value = targetId;
                }
              } catch (error) {
                console.log("failed to update the target identifier value");
              }
              ////get the object from S3
              //let supersededDocumentReference = JSON.parse(await getDocumentReference(targetId));
              //supersededDocumentReference.status = "superseded";
              //let SDRUUID = supersededDocumentReference.id;
              //let SDRID = supersededDocumentReference.masterIdentifier.value.replace("urn:oid:", "");
              ////overwrite superseded objects
              //let skey = "DocumentReference-urn:oid:"+SDRID;
              //let ss3response = await writeFile(JSON.stringify(supersededDocumentReference), S3BUCKET, skey);
              //skey = "DocumentReference-urn:uuid:"+SDRUUID;
              //ss3response = await writeFile(JSON.stringify(supersededDocumentReference), S3BUCKET, skey);
              //console.log(JSON.stringify(ss3response));
            }
          }
          else if (DocumentReferenceObject.relatesTo[0].code == "transforms")
          {
            //nothing specific needed here as the original document has been transformed in-situ
            delete DocumentReferenceObject.relatesTo;
          }
          else if (DocumentReferenceObject.relatesTo[0].code == "appends")
          {
            //nothing specific needed here as the original document has been transformed in-situ
            delete DocumentReferenceObject.relatesTo;
          }
        }
        //add item to NRL
        let nrlDocRef = JSON.parse(JSON.stringify(DocumentReferenceObject));
        //following attributes needed for NRL
        if (!nrlDocRef.subject.identifier) nrlDocRef.subject.identifier = NRLParams.subject.identifier;
        if (!nrlDocRef.custodian) nrlDocRef.custodian = NRLParams.custodian;
        //if (!nrlDocRef.type) nrlDocRef.type = NRLParams.type;
        //nrlDocRef.type = NRLParams.type;
        //nrlDocRef.category = NRLParams.category;
        delete nrlDocRef.text;
        delete nrlDocRef.contained;
        //

        //console.log("delete doc first in case already exists");
        //try {
        //  let nrldelete = await deleteDocRef(nrlDocRef, APIENVIRONMENT, APIKEYSECRET, APIKEY);
        //  console.log(JSON.stringify(nrldelete));
        //} catch (error) {
        //  console.log(error.message);
        //}
        let nrlresponse = await sendDocRef(nrlDocRef, APIENVIRONMENT, APIKEYSECRET, APIKEY);
        console.log(nrlresponse);
        //set URL location of DR from NRL response
        //the id of the DocumentReference is the end of the "location" header returned by NRL
        //check status code
        if (nrlresponse.status > 299)
        {
            //error scenario
            let actualResponseEntry = JSON.parse(JSON.stringify(entryTemplate));
            delete actualResponseEntry.response.location;
            actualResponseEntry.response.status = ""+nrlresponse.status;
            if (entry.fullUrl) actualResponseEntry['fullUrl'] = entry.fullUrl;
            let outcome = JSON.parse(nrlresponse.body);
            actualResponseEntry.response['outcome'] = outcome;
            responseTemplate.entry.push(JSON.parse(JSON.stringify(actualResponseEntry)));
          }
        else
        {
          let location = nrlresponse.headers.location;
          let nrlId = location.substring(location.lastIndexOf("/")+1);
          entryTemplate.response.location = targetEndpoint + "DocumentReference/" + nrlId;
          responseTemplate.entry.push(JSON.parse(JSON.stringify(entryTemplate)));
          //save file to S3 with the new id
          //save item to S3
          DocumentReferenceObject.id = nrlId;
          let body = JSON.stringify(DocumentReferenceObject);
          let key = "DocumentReference-urn:oid:"+DRMASTERID;
          let s3response = await writeFile(body, S3BUCKET, key);
          key = "DocumentReference-urn:uuid:"+DRUUID;
          s3response = await writeFile(body, S3BUCKET, key);
          console.log(JSON.stringify(s3response));
          key = "DocumentReference-"+nrlId;
          s3response = await writeFile(body, S3BUCKET, key);
          console.log(JSON.stringify(s3response));
        }
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
        entryTemplate.response.location = targetEndpoint + "List/" + LISTUUID;
        let LISTDRID = entry.resource.entry[0].item.reference.replace("urn:uuid:", "");
        ListObject = entry.resource;
        //add id
        ListObject["id"] = LISTUUID;
        //set content URL
        ListObject.entry[0].item.reference = "https://main-mhdpoc-mhdpocbe.nhsdta.com/extapi/FHIR/R4/DocumentReference/"+LISTDRID;
        //save item to S3
        let body = JSON.stringify(ListObject);
        let key = "List-urn:oid:"+LISTID;
        let s3response = await writeFile(body, S3BUCKET, key);
        key = "List-urn:uuid:"+LISTUUID;
        s3response = await writeFile(body, S3BUCKET, key);
        console.log(JSON.stringify(s3response));
        responseTemplate.entry.push(JSON.parse(JSON.stringify(entryTemplate)));
      }
      if (entry.resource.resourceType == "Binary"){
        entryTemplate.response.location = targetEndpoint + "Binary/" + entry.fullUrl.replace("urn:uuid:", "");
        responseTemplate.entry.push(JSON.parse(JSON.stringify(entryTemplate)));
      }
  }


  let response = {
      statusCode: 200,
      "headers": {
          "Content-Type": "application/fhir+json"
      },
      body: JSON.stringify(responseTemplate)
  };
  console.log(JSON.stringify(response));
  return response;
}

export const handler = async (event) => {
  console.log(JSON.stringify(event));
  /// TODO - determine if request came via API-M and adjust the return URL accordingly
  // take the presence of nhsd-correlation-id header (event.headers.nhsd-correlation-id) and nhsd-request-id as evidence of being processed
  // via NHS E API-M
    try {
        //check if gzipped body first
        if (event.headers["content-encoding"] == "gzip")
        {
          let unzippedBody = gunzipSync(Buffer.from(event.body, "base64")).toString("utf-8");
          event.body = unzippedBody;
          event.isBase64Encoded = false;
        }
        let targetEndpoint = DIRECT_ENDPOINT;
        console.log(event.body);
        if (event.headers["nhsd-correlation-id"]){
          targetEndpoint = APIM_ENDPOINT;
        }
        console.log("targetEndpoint is " + targetEndpoint);
        const plain = (event.isBase64Encoded) ? Buffer.from(event.body, 'base64').toString('utf8') : event.body;
        const requestJson = JSON.parse(plain);
        console.log(JSON.stringify(requestJson));

        //check bundle profile
        const bundleprofile = requestJson.meta.profile[0];
        console.log("profile of bundle is " + bundleprofile);
        if (bundleprofile.endsWith(MHD_3_MINIMAL_PROFILE)) return await processmhd3(event, requestJson, targetEndpoint);
        if (bundleprofile.endsWith(MHD_3_COMPREHENSIVE_PROFILE)) return await processmhd3(event, requestJson, targetEndpoint);
        if (bundleprofile.endsWith(MHD_4_MINIMAL_PROFILE)) return await processmhd4(event, requestJson, targetEndpoint);
        if (bundleprofile.endsWith(MHD_4_COMPREHENSIVE_PROFILE)) return await processmhd4(event, requestJson, targetEndpoint);
        // Requirements of MHDS state that comprehensive uncontained is required
        if (bundleprofile.endsWith(MHD_4_COMPREHENSIVE_UNCONTAINED_PROFILE)) return await processmhd4(event, requestJson, targetEndpoint);
        return returnError("Unknown Bundle meta profile");
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

function validatemhd(requestJson){
  let issue = [];
  let documentReferencePresent = false;
  let documentManifestPresent = false;
  let listPresent = false;
  for (let entry of requestJson.entry) {
    //check patient reference
    if (!checkPatientReference(entry.resource)) 
    {
      issue.push({
        "severity": "error",
        "code": "unknown",
        "diagnostics": "Unable to resolve patient in " + entry.fullUrl + " resource of type " + entry.resource.resourceType
      });
    }
    if (entry.resource.resourceType == "DocumentReference")
    {
      console.log("checking a DocumentReference");
      documentReferencePresent = true;
      //check contentType
      if (entry.resource.content && entry.resource.content.length > 0){
        for (let content of entry.resource.content)
        {
          if (!content.attachment.contentType || content.attachment.contentType==""){
            issue.push({
              "severity": "error",
              "code": "unknown",
              "diagnostics": "Missing contentType in " + entry.fullUrl + " resource of type " + entry.resource.resourceType
            });
          }
        }
      }
      else
      {
        issue.push({
          "severity": "error",
          "code": "unknown",
          "diagnostics": "Missing resource.content in " + entry.fullUrl + " resource of type " + entry.resource.resourceType
        });
      }
      if (!entry.resource.masterIdentifier)
      {
        issue.push({
          "severity": "error",
          "code": "unknown",
          "diagnostics": "Missing masterIdentifer in " + entry.fullUrl + " resource of type " + entry.resource.resourceType
        });
      }

    }
    if (entry.resource.resourceType == "DocumentManifest") 
    {
      console.log("checking a DocumentMainfest");
      documentManifestPresent = true;
    }
    if (entry.resource.resourceType == "List") 
    {
      console.log("checking a List");
      listPresent = true;
      //check sourceId extension
      if (!entry.resource.extension || entry.resource.extension.length ==0)
      {
        issue.push({
          "severity": "error",
          "code": "unknown",
          "diagnostics": "Missing ihe-sourceId extension in " + entry.fullUrl + " resource of type " + entry.resource.resourceType
        });
      }
      else {
        let sourceIdPresent = false;
        for (let extension of entry.resource.extension){
          if (extension.url == "https://profiles.ihe.net/ITI/MHD/StructureDefinition/ihe-sourceId" || 
          extension.url ==  "http://profiles.ihe.net/ITI/MHD/StructureDefinition/ihe-sourceId")sourceIdPresent = true;
        }
        if (!sourceIdPresent){
          issue.push({
            "severity": "error",
            "code": "unknown",
            "diagnostics": "Missing ihe-sourceId extension in " + entry.fullUrl + " resource of type " + entry.resource.resourceType
          });
        }
      }
      if (!entry.resource.date || entry.resource.date =="")
      {
        issue.push({
          "severity": "error",
          "code": "unknown",
          "diagnostics": "Missing date in " + entry.fullUrl + " resource of type " + entry.resource.resourceType
        });
      }
      if (!entry.resource.identifier || entry.resource.identifier.length ==0)
      {
        issue.push({
          "severity": "error",
          "code": "unknown",
          "diagnostics": "Missing identifier in " + entry.fullUrl + " resource of type " + entry.resource.resourceType
        });
      }
      else {
        let ususalIdentifierPresent = false;
        for (let identifier of entry.resource.identifier)
        {
          if (identifier.use == "usual") ususalIdentifierPresent = true;
        }
        if (!ususalIdentifierPresent){
          issue.push({
            "severity": "error",
            "code": "unknown",
            "diagnostics": "Missing usual identifier in " + entry.fullUrl + " resource of type " + entry.resource.resourceType
          });
        }
      }
    }
  }
  if (!documentReferencePresent){
    issue.push({
      "severity": "error",
      "code": "unknown",
      "diagnostics": "Missing DocumentReference in Bundle"
    });
  }
  if (!documentManifestPresent && !listPresent){
    issue.push({
      "severity": "error",
      "code": "unknown",
      "diagnostics": "Missing DocumentManifest or List in Bundle"
    });
  }
  return issue;
}

function returnError(errorMessage){
  let operationOutcome = {
    "resourceType": "OperationOutcome",
    "issue": [ {
      "severity": "error",
      "diagnostics": errorMessage
    } ]
  }
  let response = {
      statusCode: 400,
      "headers": {
          "Content-Type": "application/json+fhir"
      },
      body: JSON.stringify(operationOutcome)
  }
  return response;
}

function checkPatientReference(resource){
  if (resource.resourceType == "Binary") return true;
  //either has reference or identifier (nhs number)
  if (! resource.subject.identifier){
    let subjectReference = resource.subject.reference;
    //hardcoded for testing
    if (!(subjectReference.startsWith("http://localhost:9760/asbestos/proxy/default__default/Patient") || 
      subjectReference.startsWith("http://ehealthsuisse.ihe-europe.net:9760/asbestos/proxy/default__default/Patient"))) return false;
  }
  else
  {
    //check NHS number
    let system = resource.subject.identifier.system;
    if (system != "https://fhir.nhs.uk/Id/nhs-number") return false;
    if (! resource.subject.identifier.value) return false;
  }
  return true;
}

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

async function getDocumentReference(documentid)
{
  let key = "DocumentReference-urn:oid:"+documentid;
  let params = {
    Key: key,
    Bucket: S3BUCKET,
  };

  let buf;
  try {
    buf = await getS3Object(params);
  } catch (error) {
    key = "DocumentReference-urn:uuid:"+documentid;
    params = {
      Key: key,
      Bucket: S3BUCKET,
    };
    buf = await getS3Object(params);
  }
  //convert the Buffer to a string
  let docRefString = buf.toString();
  return docRefString;  
}