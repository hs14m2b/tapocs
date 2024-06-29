import { createSignedJwtForAuth, getOAuth2AccessToken } from '../api_common_functions.mjs';
import { URLSearchParams } from 'url';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { readFileSync } from 'fs';
const { sign } = jwt;
const HTTPS = "https://";
const apiClientPrivateKey = readFileSync('../../certs/mhdtest001.key', 'utf8');

let https;
try {
  https = await import('node:https');
} catch (err) {
  console.log('https support is disabled!');
}
let newId = "00000000-make-unique-for-sandbox-requestdddef";//uuidv4(); //Y05868-70bce845-679e-42ea-a909-30ac78ec1956
console.log(newId);
let mhdsBundle = readFileSync("mhdsbundle.json");

 
async function sendMHDSBundle (mhdsBundle) 
  {
    let postString = mhdsBundle;
    let datalength = postString.length
    let XRequestID = uuidv4();
    // request option
    let options = {
      host: "int.api.service.nhs.uk",
      port: 443,
      method: 'POST',
      path: "/nhse-tsas-solarch-demo-api/mhdspoc/FHIR/R4",
      rejectUnauthorized: false,
      headers: {
        'Authorization': 'Bearer '+ await getAccessToken(),
        'accept': 'application/fhir+json;version=1',
        'x-request-id': XRequestID,
        'x-correlation-id': '11C46F5F-CDEF-4865-94B2-0EE0EDCC26DA',
        'nhsd-end-user-organisation-ods': 'Y05868',
        'content-type': 'application/fhir+json;version=1',
        'content-length': datalength
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
                  "headers": res.headers,
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
         
        //send request with the postString json
        req.write(postString);
        req.end();
    });
  }

async function getAccessToken(){
  //console.log(apiClientPrivateKey);
  //let secretOrPrivateKey = createPrivateKey(apiClientPrivateKey);
  let blah = await createSignedJwtForAuth("kqU7ldmK4wVoDQA6c76bNsAFMzw8SmGQ", 
  "mhdtest001", apiClientPrivateKey,
  "int.api.service.nhs.uk", "/oauth2/token");
  //console.log(blah);
  let blah2 = await getOAuth2AccessToken(blah, "int.api.service.nhs.uk", "/oauth2/token");
  console.log(blah2);
  //load into JSON object
  let blah3 = JSON.parse(blah2);
  return blah3.access_token;
}


let result = await sendMHDSBundle(mhdsBundle);
console.log(result);