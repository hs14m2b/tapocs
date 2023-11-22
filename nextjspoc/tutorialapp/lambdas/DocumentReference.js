exports.handler = async (event) => {
    console.log(JSON.stringify(event));
    try {
        console.log(event.body);
        
        //get the documentid path parameter and put into template
        const documentid = event.pathParameters.documentid;

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
                "url": "https://main-nextjsfe.nhsdta.com/extapi/FHIR/R4/dummyfhirendpoint/Binary/" + documentid,
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
            body: JSON.stringify(DocumentReferenceTemplate)
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