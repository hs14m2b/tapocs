import { URLSearchParams } from 'url';
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
let drId = "Y05868-" + "1e404af3-077f-4bee-b7a6-a9be97e1ce01";// "1e404af3-077f-4bee-b7a6-a9be97e1ce01";

 
async function getDocRef (drId) 
  {
    let XRequestID = uuidv4();
    // request option
    let options = {
      host: "sandbox.api.service.nhs.uk",
      port: 443,
      method: 'GET',
      path: "/record-locator/producer/FHIR/R4/DocumentReference/" + drId,
      rejectUnauthorized: false,
      headers: {
        //'Authorization': 'Bearer '+ access_token,
        'accept': 'application/fhir+json;version=1',
        'x-request-id': XRequestID,
        'x-correlation-id': '11C46F5F-CDEF-4865-94B2-0EE0EDCC26DA',
        'nhsd-end-user-organisation-ods': 'Y05868'
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
         
        //send request
        req.end();
    });
  }

let result = await getDocRef(drId);
console.log(result);