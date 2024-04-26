import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
const { sign } = jwt;
const HTTPS = "https://";

let https;
try {
  https = await import('node:https');
} catch (err) {
  console.log('https support is disabled!');
}
let newId = uuidv4(); //Y05868-70bce845-679e-42ea-a909-30ac78ec1956

 
export const deleteDocRef = async (docRef) => 
{
  let XRequestID = uuidv4();
  let org = docRef.custodian.identifier.value;
  // request option
  let options = {
    host: "sandbox.api.service.nhs.uk",
    port: 443,
    method: 'DELETE',
    path: "/record-locator/producer/FHIR/R4/DocumentReference/"+docRef.id,
    rejectUnauthorized: false,
    headers: {
      //'Authorization': 'Bearer '+ access_token,
      'accept': 'application/fhir+json;version=1',
      'X-Request-ID': XRequestID,
      'NHSD-End-User-Organisation-ODS': org,
  }
  };

  console.log("request options are  " + JSON.stringify(options));
  return new Promise(function (resolve, reject) {
      // request object
      var req = https.request(options, function (res) {
          var result = '';
          console.log("HTTP status code: " + res.statusCode);
          res.on('data', function (chunk) {
              result += chunk;
          });
          res.on('end', function () {
              console.log(result);
              let response = {
                "status": res.statusCode,
                "body": result
              }
              resolve(response);
          });
          res.on('error', function (err) {
              console.log(err);
              reject(err);
          })
      });
        
      // req error
      req.on('error', function (err) {
        console.log(err);
      });
        
      req.end();
  });
}
