exports.handler = async (event) => {
    console.log(JSON.stringify(event));
    try {
        console.log(event.body);
        
        const plain = Buffer.from(event.body, 'base64').toString('utf8');
        const requestJson = JSON.parse(plain);
        console.log(JSON.stringify(requestJson));

        //find identifier for DocumentReference
        let DRID = "";
        let DMID = "";
        for (let entry of requestJson.entry) {
            if (entry.resource.resourceType == "DocumentReference") DRID = entry.resource.masterIdentifier.value.replace("urn:oid:", "");
            if (entry.resource.resourceType == "DocumentManifest") DMID = entry.resource.masterIdentifier.value.replace("urn:oid:", "");
        }

        let hardcodedresponse = {
            "resourceType": "Bundle",
            "type": "transaction-response",
            "entry": [ {
              "response": {
                "status": "201",
                "location": "https://main-nextjsfe.nhsdta.com/extapi/FHIR/R4/dummyfhirendpoint/DocumentReference/" + DRID
              }
            }, {
              "response": {
                "status": "201",
                "location": "https://main-nextjsfe.nhsdta.com/extapi/FHIR/R4/dummyfhirendpoint/DocumentManifest/" + DMID
              }
            }, {
              "response": {
                "status": "201",
                "location": "https://main-nextjsfe.nhsdta.com/extapi/FHIR/R4/dummyfhirendpoint/Binary/" + DRID
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