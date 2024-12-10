var APIENVIRONMENT;
var APIKEYSECRET;
var APIKNAMEPARAM;
// these are defined at https://profiles.ihe.net/ITI/MHD/ITI-65.html#23654121-bundle-resources
// the MHD_3 ones are based of an old version of FHIR so aren't relevant to the NIR Alpha
const MHD_3_MINIMAL_PROFILE = "ihe.net/fhir/StructureDefinition/IHE_MHD_Provide_Minimal_DocumentBundle";
const MHD_3_COMPREHENSIVE_PROFILE = "ihe.net/fhir/StructureDefinition/IHE_MHD_Provide_Comprehensive_DocumentBundle";
const MHD_4_MINIMAL_PROFILE = "profiles.ihe.net/ITI/MHD/StructureDefinition/IHE.MHD.Minimal.ProvideBundle";
const MHD_4_COMPREHENSIVE_PROFILE = "profiles.ihe.net/ITI/MHD/StructureDefinition/IHE.MHD.Comprehensive.ProvideBundle";
const MHD_4_COMPREHENSIVE_UNCONTAINED_PROFILE = "profiles.ihe.net/ITI/MHD/StructureDefinition/IHE.MHD.UnContained.Comprehensive.ProvideBundle";

//hard coded endpoint values
var DIRECT_ENDPOINT;
var APIM_ENDPOINT;


// this function undertakes the main processing of the transaction request
async function processmhd4(event, requestJson, targetEndpoint, sendDocRef, postResource, putResource)
{
  // check the structure of the FHIR R4 transaction request
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
  let DocumentReferenceObject = {};
  let ListObject = {};
  let mappings = [];
  try {
    console.log("about to check mappings");
    mappings = mapReferences(requestJson.entry);
    console.log("mappings are " + JSON.stringify(mappings));
  } catch (error) {
    console.log(error);
  }
  // loop through each entry in the transaction and process.
  // for the NIR Alpha there is not full compliance with FHIR transaction, specifically is isn't an "all or nothing" in case of issues
  for (let entryReferenceIndex in mappings){
      let entry = requestJson.entry[mappings[entryReferenceIndex].entryPosition];
      let mapping =  mappings[entryReferenceIndex];
      console.log("mapping details for entry are " + JSON.stringify(mapping));
      console.log("updating references");
      let entryString = JSON.stringify(entry);
      //replace all references in a loop
      for (let entryReferenceIndex2 in mappings)
      {
        let mapping2 =  mappings[entryReferenceIndex2];
        if (mapping2.fullUrl != entry.fullUrl && mapping2.count > 1 && mapping.resourceReferences.includes(mapping2.fullUrl))
        {
          if (!mapping2.id)
            {
              console.log("unable to update reference to " + mapping2.fullUrl + " as the id has not yet been generated");
            }
            else
            {
              entryString = entryString.replace(mapping2.fullUrl, mapping2.resourceType + "/" + mapping2.id);
            }
        }
      }
      //parse entryString back into entry
      entry = JSON.parse(entryString);

      if (entry.resource.resourceType == "DocumentReference")
      {
        // default values to override inbound ones for testing.
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
          },
          "author": [{
            "identifier": {
              "system": "https://fhir.nhs.uk/Id/ods-organization-code",
              "value": "Y05868"
            }
          }]
        }
        // this is used to help with querying a local copy of the DocumentReference. Can be removed for NIR Alpha
        DRMASTERID = entry.resource.masterIdentifier.value.replace("urn:oid:", "");
        let DRUUID = entry.fullUrl.replace("urn:uuid:", "");
        //let DOCID = entry.resource.content[0].attachment.url.replace("urn:uuid:", "");
        DocumentReferenceObject = entry.resource;
        //check if the DocumentReference replaces another one (not relevant for NIR Alpha as no replacements)
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
        // add attributes needed for NRL if not present
        if (!nrlDocRef.subject.identifier) nrlDocRef.subject.identifier = NRLParams.subject.identifier;
        if (!nrlDocRef.custodian) nrlDocRef.custodian = NRLParams.custodian;
        if (!nrlDocRef.author) nrlDocRef.author = NRLParams.author;
        //if (!nrlDocRef.type) nrlDocRef.type = NRLParams.type;
        //if (!nrlDocRef.category) nrlDocRef.category = NRLParams.category;
        delete nrlDocRef.text;
        delete nrlDocRef.contained;

        let nrlresponse = await sendDocRef(nrlDocRef, APIENVIRONMENT, APIKEYSECRET, APIKNAMEPARAM);
        console.log(nrlresponse);
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
            mappings[entryReferenceIndex]["response"] = JSON.parse(JSON.stringify(actualResponseEntry));
            //responseTemplate.entry.push(JSON.parse(JSON.stringify(actualResponseEntry)));
        }
        else
        {
          // set URL location of DocumentReference from NRL response
          let location = nrlresponse.headers.location;
          // the id of the DocumentReference is the end of the "location" header returned by NRL
          let nrlId = location.substring(location.lastIndexOf("/")+1);
          // the location is set as the MHDS endpoint as opposed to the NRL one.
          entryTemplate.response.location = targetEndpoint + "DocumentReference/" + nrlId;
          mappings[entryReferenceIndex]["response"] = JSON.parse(JSON.stringify(entryTemplate));
          //add item to AWS Healthlake -- using PUT to specify the id to align to NRL. Healthlake supports search that NRL doesn't at this point
          nrlDocRef.id = nrlId;
          let healthlakeresponse = await putResource(nrlDocRef, "DocumentReference", nrlDocRef.custodian.identifier.value, APIENVIRONMENT, APIKEYSECRET, APIKNAMEPARAM);
          console.log("healthlake response is " + JSON.stringify(healthlakeresponse));
          console.log("updating the mapping entry");
          mappings[entryReferenceIndex]["id"] = nrlId;
        }
      }
      else{
        //generic processing
        let fhirResource = entry.resource;
        let resourceType = mapping.resourceType;
        let healthlakeresponse = await postResource(fhirResource, resourceType, "Y05868", APIENVIRONMENT, APIKEYSECRET, APIKNAMEPARAM);
        console.log("healthlake response is " + JSON.stringify(healthlakeresponse));
        //use the "id" from healthlake
        let healthlakeResource = JSON.parse(healthlakeresponse.body);
        let healthlakeResourceId = healthlakeResource.id;
        entryTemplate.response.location = targetEndpoint + resourceType + "/" + healthlakeResourceId;
        mappings[entryReferenceIndex]["response"] = JSON.parse(JSON.stringify(entryTemplate));
        //responseTemplate.entry.push(JSON.parse(JSON.stringify(entryTemplate)));
        console.log("updating the mapping entry");
        mappings[entryReferenceIndex]["id"] = healthlakeResourceId;
      }
  }

  //sort responses so they agree with input bundle order
  mappings.sort((a,b) => a.entryPosition - b.entryPosition);
  console.log("mappings are now " + JSON.stringify(mappings));
  for (let mapping of mappings)
  {
    responseTemplate.entry.push(mapping.response);
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

// entry point for the lambda handler
export const handler = async (event, sendDocRef, postResource, putResource, gunzipSync, APIENVIRONMENT_IN, APIKEYSECRET_IN, APIKNAMEPARAM_IN) => {
  console.log(JSON.stringify(event));
  APIENVIRONMENT = APIENVIRONMENT_IN;
  APIKEYSECRET = APIKEYSECRET_IN;
  APIKNAMEPARAM = APIKNAMEPARAM_IN;
  DIRECT_ENDPOINT = "https://" + APIENVIRONMENT + "-mhdpoc-mhdpocbe.nhsdta.com/mhdspoc/FHIR/R4/";
  APIM_ENDPOINT = "https://" + APIENVIRONMENT + ".api.service.nhs.uk/nhse-tsas-solarch-demo-api/mhdspoc/FHIR/R4/"
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
        // check the HTTP headers to ascertain if the request came via API-M, and set targetEndpoint accordingly
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
        // MHD_4_MINIMAL_PROFILE - most attributes in DocumentReference are marked as optional in the minimal profile so not technically appropriate for NIR Alpha
        // https://profiles.ihe.net/ITI/MHD/StructureDefinition-IHE.MHD.Minimal.ProvideBundle.html
        // if (bundleprofile.endsWith(MHD_4_MINIMAL_PROFILE)) return await processmhd4(event, requestJson, targetEndpoint);
        // MHD_4_COMPREHENSIVE_PROFILE - this profile requires that all resources are contained within the bundle - e.g. full patient and organisation details etc. This
        // does not align to the architecture or engineering principles of using PDS / ODS etc - so don't really need to consider requests
        // with this profile at this stage. Could be a consideration for post-Alpha where analysis can be done on how to treat contained resources
        // https://profiles.ihe.net/ITI/MHD/StructureDefinition-IHE.MHD.Comprehensive.ProvideBundle.html
        // if (bundleprofile.endsWith(MHD_4_COMPREHENSIVE_PROFILE)) return await processmhd4(event, requestJson, targetEndpoint);
        // MHD_4_COMPREHENSIVE_UNCONTAINED_PROFILE - Requirements of MHDS state that comprehensive uncontained is required given the strategy of using PDS etc
        // https://profiles.ihe.net/ITI/MHD/StructureDefinition-IHE.MHD.UnContained.Comprehensive.ProvideBundle.html
        if (bundleprofile.endsWith(MHD_4_COMPREHENSIVE_UNCONTAINED_PROFILE)) return await processmhd4(event, requestJson, targetEndpoint, sendDocRef, postResource, putResource);
        // return error as bundle profile does not match one which can be processed for the NIR alpha
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
// function to check the overall transaction bundle according to MHD rules
function validatemhd(requestJson){
  let issue = [];
  let documentReferencePresent = false;
  let documentManifestPresent = false;
  let listPresent = false;
  for (let entry of requestJson.entry) {
    // check patient reference contained in the entry
    if (!checkPatientReference(entry.resource))
    {
      issue.push({
        "severity": "error",
        "code": "unknown",
        "diagnostics": "Unable to resolve patient in " + entry.fullUrl + " resource of type " + entry.resource.resourceType
      });
    }
    // checks for DocumentReference
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
      // check masterIdentifier
      if (!entry.resource.masterIdentifier)
      {
        issue.push({
          "severity": "error",
          "code": "unknown",
          "diagnostics": "Missing masterIdentifer in " + entry.fullUrl + " resource of type " + entry.resource.resourceType
        });
      }
      // other metadata could/should check in a non-alpha phase include Accession Number (identifier[].type.text=="Accession-Number")
      // category, type, custodian, content[].format (for retrieval mechanism), content[].attachment.url, custodian
    }
    // this is a legacy STU3 check
    if (entry.resource.resourceType == "DocumentManifest")
    {
      console.log("checking a DocumentMainfest");
      documentManifestPresent = true;
    }
    //this is a R4 check, but not relevant for the NIR Alpha based on the search patterns. Searches will be via NHS Number + "category" + "type". The concept of folders etc is not supported.
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

  // this check is not relevant for the NIR Alpha
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
  // nothing to check for "Binary" resources. Irrelevant for the NIR Alpha as no Binary resources contained
  if (resource.resourceType == "Binary") return true;
  // either has reference (non-NHS number) or identifier (NHS number)
  // check for identifier not relevant for NIR Alpha as it must use the NHS number
  if (! resource.subject.identifier){
    let subjectReference = resource.subject.reference;
    //hardcoded for testing
    if (!(subjectReference.startsWith("http://localhost:9760/asbestos/proxy/default__default/Patient") ||
      subjectReference.startsWith("http://ehealthsuisse.ihe-europe.net:9760/asbestos/proxy/default__default/Patient"))) return false;
  }
  else
  {
    // check NHS number
    let system = resource.subject.identifier.system;
    if (system != "https://fhir.nhs.uk/Id/nhs-number") return false;
    if (! resource.subject.identifier.value) return false;
  }
  return true;
}

function mapReferences(bundleEntries)
{
  console.log("entered mapReferences");
  let mappings = [];
  let bundleString = JSON.stringify(bundleEntries);
  let entryPosition = 0;
  for (let entry of bundleEntries){
    let fullUrl = entry.fullUrl;
    let resourceType = entry.resource.resourceType;
    console.log("fullUrl is " + fullUrl);
    //check how many times the fullUrl is referenced elsewhere in the JSON.
    let count=0;
    let indexPosition=0;
    while (indexPosition > -1)
    {
      indexPosition = bundleString.indexOf(fullUrl, indexPosition);
      if (indexPosition > -1) indexPosition += 1;
      //console.log("index position is " + indexPosition);
      count += (indexPosition > -1) ? 1 : 0;
    }
    console.log("There are " + count + " references to " + fullUrl);
    mappings.push({"fullUrl": fullUrl, "count": count, "entryPosition": entryPosition, "resourceType": resourceType});
    entryPosition += 1;
  }
  console.log("finished initial mapping of the references - now checking back-references");
  for (let entryIndex in mappings)
  {
    let resourceReferences = [];
    let bundleEntryString = JSON.stringify(bundleEntries[mappings[entryIndex].entryPosition]);
    for (let entryIndex2 in mappings)
    {
      if (entryIndex != entryIndex2)
      {
        let fullUrl2 = mappings[entryIndex2].fullUrl;
        if (bundleEntryString.indexOf(fullUrl2) > -1) resourceReferences.push(fullUrl2);
      }
    }
    mappings[entryIndex]["resourceReferences"] = resourceReferences;
  }
  console.log("finished mapping resource references within each entry");
  //check if any circular references
  for (let entryIndex in mappings)
  {
    let circularReferences = [];
    let resourceReferences = mappings[entryIndex]["resourceReferences"];
    let fullUrl = mappings[entryIndex]["fullUrl"];
    for (let entryIndex2 in mappings)
    {
      if (entryIndex != entryIndex2) //don't check resource against itself
      {
        let fullUrl2 = mappings[entryIndex2].fullUrl;
        if (resourceReferences.includes(fullUrl2))
        {
          console.log("checking referenced resource for circular reference");
          let resourceReferences2 = mappings[entryIndex2]["resourceReferences"];
          if (resourceReferences2.includes(fullUrl)) circularReferences.push(fullUrl2);
        }
      }
    }
    mappings[entryIndex]["circularReferences"] = circularReferences;
  }
  console.log("finished mapping circular references within each entry");
  mappings.sort(compare);
  return mappings;
}

function compare( a, b ) {
  //-1 => a before b
  //1 => b before a
  //check if a or b in circular reference
  console.log("comparing " + JSON.stringify(a) + " and " + JSON.stringify(b));
  if (a.circularReferences.includes(b.fullUrl))
  {
    console.log("circular reference");
    return 0;
  }
  //no circular references - check if dependent references
  if (a.resourceReferences.includes(b.fullUrl))
  {
    //a is dependent upon b
    console.log("a depends upon b - b comes first");
    return 1;
  }
  if (b.resourceReferences.includes(a.fullUrl))
  {
    //b is dependent upon a
    console.log("b depends upon a - a comes first");
    return -1;
  }
  //no resource dependencies - sort on dependency count
  if ( a.resourceReferences.length < b.resourceReferences.length ){
    return -1;
  }
  if ( a.resourceReferences.length > b.resourceReferences.length ){
    return 1;
  }
  //no difference in resource dependencies - sort on count
  if ( a.count < b.count ){
    return 1;
  }
  if ( a.count > b.count ){
    return -1;
  }
  return 0;
}
