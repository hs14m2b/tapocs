exports.handler = async (event) => {
    console.log(JSON.stringify(event));
    try {
        console.log(event.body);
        
        //get the documentid path parameter and put into template
        const documentid = event.pathParameters.documentid;
        //GET /asbestos/proxy/default__selftest_limited/DocumentManifest?identifier=urn:oid:1.2.10.0.2.15.2023.11.21.15.58.23.80.2&status=current&patient.identifier=urn:oid:1.3.6.1.4.1.21367.13.20.1000%7CIHERED-2654
        let DocumentManifestTemplate = {
          "resourceType": "Bundle",
          "type": "searchset",
          "total": 1,
          "link": [ {
            "relation": "self",
            "url": "http://localhost:9760/asbestos/proxy/default__selftest_limited/DocumentManifest?identifier=urn:oid:1.2.10.0.2.15.2023.11.21.15.58.23.80.2&status=current&patient.identifier=urn:oid:1.3.6.1.4.1.21367.13.20.1000%7CIHERED-2654"
          } ],
          "entry": [ {
            "fullUrl": "http://localhost:9760/asbestos/proxy/default__selftest_limited/DocumentManifest/60e6946d-d5f6-4ba1-92ab-aed42d0ce757",
            "resource": {
              "resourceType": "DocumentManifest",
              "id": "60e6946d-d5f6-4ba1-92ab-aed42d0ce757",
              "masterIdentifier": {
                "system": "urn:ietf:rfc:3986",
                "value": "urn:oid:1.2.10.0.2.15.2023.11.21.15.58.23.80.2"
              },
              "identifier": [ {
                "use": "official",
                "system": "urn:ietf:rfc:3986",
                "value": "urn:uuid:60e6946d-d5f6-4ba1-92ab-aed42d0ce757"
              } ],
              "status": "current",
              "type": {
                "coding": [ {
                  "system": "http://snomed.info/sct",
                  "code": "225728007",
                  "display": "Accident and Emergency department"
                } ]
              },
              "subject": {
                "reference": "http://localhost:9760/asbestos/proxy/default__default/Patient/5"
              },
              "created": "2015-02-07T11:28:17+00:00",
              "source": "urn:oid:1.2.10.0.2.15.2023.11.21.15.58.23.80.2",
              "description": "Physical",
              "content": [ {
                "reference": "http://localhost:9760/asbestos/proxy/default__selftest_limited/DocumentReference/e6a54bbc-95c0-4ea6-abc0-b97d25c9b426"
              } ]
            },
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