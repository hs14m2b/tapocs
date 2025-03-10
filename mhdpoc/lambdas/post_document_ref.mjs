import { URLSearchParams } from 'url';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
const { sign } = jwt;
const HTTPS = "https://";
import { getSecretValue, getParamValue, environmentNeedsAuth, nrlEnvironmentMapping, createSignedJwtForAuth, getOAuth2AccessToken } from './api_common_functions.mjs';

let https;
try {
  https = await import('node:https');
} catch (err) {
  console.log('https support is disabled!');
}
let newId = uuidv4(); //Y05868-70bce845-679e-42ea-a909-30ac78ec1956

var APIKEYNAME;
var APIKEYKEY;
var apikeykeyLastRetrieved = 0;


export const sendDocRef = async (docRef, APIENVIRONMENT, APIKEYSECRET, APIKNAMEPARAM) =>
{
  let nrlEnvironment = nrlEnvironmentMapping(APIENVIRONMENT);
  let postString = JSON.stringify(docRef);
  console.log(postString);
  let datalength = postString.length
  let XRequestID = uuidv4();
  let org = docRef.custodian.identifier.value;
  // request option
  let options = {
    host: nrlEnvironment + ".api.service.nhs.uk",
    port: 443,
    method: 'POST',
    path: "/record-locator/producer/FHIR/R4/DocumentReference",
    rejectUnauthorized: false,
    headers: {
      //'Authorization': 'Bearer '+ access_token,
      'accept': 'application/fhir+json;version=1',
      'X-Request-ID': XRequestID,
      'NHSD-End-User-Organisation-ODS': org,
      'Content-Type': 'application/fhir+json;version=1',
      'Content-Length': datalength
    }
  };

  if (environmentNeedsAuth(APIENVIRONMENT)){
    let currentTime = Date.now();
    //get the apikey key and key name if not present or last retrieved more than 5 minutes ago
    if (!APIKEYKEY || !APIKEYNAME || ((currentTime - apikeykeyLastRetrieved) > 300000)){
      console.log("retrieving certificates from secrets manager");
      APIKEYKEY = await getSecretValue(APIKEYSECRET);
      console.log("retrieving API Key Name from Parameter Store");
      APIKEYNAME = await getParamValue(APIKNAMEPARAM);
      //set key last retrieve to now
      apikeykeyLastRetrieved = currentTime;
    }
    //get api access token
    //APIKEYKEY is in format KID|KEY
    let kid = APIKEYKEY.substr(0, APIKEYKEY.indexOf("|"));
    let key = APIKEYKEY.substr(APIKEYKEY.indexOf("|")+1)
    let signedJwt = createSignedJwtForAuth(APIKEYNAME, kid, key, APIENVIRONMENT + ".api.service.nhs.uk", "/oauth2/token")
    let tokenResponse = await getOAuth2AccessToken(signedJwt, APIENVIRONMENT + ".api.service.nhs.uk", "/oauth2/token");
    //load into JSON object
    let tokenResponseJson = JSON.parse(tokenResponse);
    //add to headers
    options.headers["Authorization"] = "Bearer " + tokenResponseJson.access_token;
  }

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
