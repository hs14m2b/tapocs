import { createSignedJwtForAuth, getOAuth2AccessToken, getOAuth2AccessTokenViaTokenExchange } from '../api_common_functions.mjs';

import { readFileSync } from 'node:fs';

const apiClientPrivateKey = readFileSync('../../certs/mhdtest001.key', 'utf8');

import { URLSearchParams } from 'url';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
const { sign } = jwt;
const HTTPS = "https://";
const APIMDOMAIN = "dev.api.service.nhs.uk";
const ODSCode = "Y05868";
const OAuthAPIKey = "MAFXtNkdTP7gn5xAKFKIj12jtnGvDbmx"; //API Key for test-solarch-demo client
// use https://demoapiconsdemo.nhsdta.com/client to get the token
const NHSLOGINIDTOKEN = "eyJhbGciOiJSUzUxMiIsImF1ZCI6InRzYXNzb2xhcmNoZGVtb2NsaWVudCIsImV4cCI6MTczODc5NTI4NiwiaWF0IjoxNzM4NzkxNjg2LCJpc3MiOiJodHRwczovL2F1dGguc2FuZHBpdC5zaWduaW4ubmhzLnVrIiwianRpIjoiZTZjMWQ2MWUtZDcwMC00NTA1LTg3MGYtOGE2M2U1ODQxYzk0Iiwia2lkIjoiYWMxMDI5ZDJjYjgxYjQ1MjdhMGI2M2UyYjRmMjgwMzQ1ZjA0ZGQ0MiIsIm5vbmNlIjoibm9uY2V2YWx1ZSIsInN1YiI6IjQ5ZjQ3MGExLWNjNTItNDliNy1iZWJhLTBmOWNlYzkzN2M0NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJodHRwczovL2F1dGguc2FuZHBpdC5zaWduaW4ubmhzLnVrIiwic3ViIjoiNDlmNDcwYTEtY2M1Mi00OWI3LWJlYmEtMGY5Y2VjOTM3YzQ2IiwiYXVkIjoidHNhc3NvbGFyY2hkZW1vY2xpZW50IiwiaWF0IjoxNzM4NzkxNjg2LCJ2dG0iOiJodHRwczovL2F1dGguc2FuZHBpdC5zaWduaW4ubmhzLnVrL3RydXN0bWFyay9hdXRoLnNhbmRwaXQuc2lnbmluLm5ocy51ayIsImF1dGhfdGltZSI6MTczODc5MTY3NCwidm90IjoiUDkuQ3AuQ2QiLCJleHAiOjE3Mzg3OTUyODYsImp0aSI6ImU2YzFkNjFlLWQ3MDAtNDUwNS04NzBmLThhNjNlNTg0MWM5NCIsIm5oc19udW1iZXIiOiI5Njg2MzY4OTczIiwiaWRlbnRpdHlfcHJvb2ZpbmdfbGV2ZWwiOiJQOSIsImlkX3N0YXR1cyI6InZlcmlmaWVkIiwidG9rZW5fdXNlIjoiaWQiLCJzdXJuYW1lIjoiTUlMTEFSIiwiZmFtaWx5X25hbWUiOiJNSUxMQVIiLCJiaXJ0aGRhdGUiOiIxOTY4LTAyLTEyIiwibm9uY2UiOiJub25jZXZhbHVlIn0.k6fW1DqoSpwiR-5cBgBlY_MFYdfMW9zb9S2wBgUz4SKE2b7JB-r3ttxN_Z6xwz3PYBc7ojCyqTiVm3wtBZfPWjCGTPzavtWAC7SwLSA4DKZUHwjRXacdpxRhl3dUO_L4vVD-KhvzzGqZk30sPmdtL0IwXnOw3mvITrM70ITMbAKjH36yQphtyO_yuyubEKm06405ip37r6C34-Xd7NTPQkbbeur8JiIPcG2nfCEdBAVc-VxKF6JrCjYYNOP_AcmuRpPlKsPXuk_iMCjBTLa6EWSjvFd0bvDXwtd8950QG7RS2uYgT1eBUVVjfgrDxE4V4E2i1lc2IY37lkckX0Xluw";

let https;
try {
  https = await import('node:https');
} catch (err) {
  console.log('https support is disabled!');
}
let drId = "Y05868-93681c2b-33a3-49ca-9899-276685cb6495";//"Y05868-" + "1e404af3-077f-4bee-b7a6-a9be97e1ce01";// "1e404af3-077f-4bee-b7a6-a9be97e1ce01";


async function getPing (drId, accessToken)
  {
    let XRequestID = uuidv4();
    // request option
    let options = {
      host: APIMDOMAIN,
      port: 443,
      method: 'GET',
      path: "/nhse-tsas-solarch-demo-api/mhdspoc/ping",
      rejectUnauthorized: false,
      headers: {
        'Authorization': 'Bearer '+ accessToken,
        'accept': 'application/fhir+json;version=1',
        'x-request-id': XRequestID,
        'x-correlation-id': '11C46F5F-CDEF-4865-94B2-0EE0EDCC26DA',
        'nhsd-end-user-organisation-ods': ODSCode
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

async function getAccessToken(){
  //console.log(apiClientPrivateKey);
  //let secretOrPrivateKey = createPrivateKey(apiClientPrivateKey);
  let blah = await createSignedJwtForAuth(OAuthAPIKey,
  "mhdtest001", apiClientPrivateKey,
  APIMDOMAIN, "/oauth2/token");
  //console.log(blah);
  //let blah2 = await getOAuth2AccessToken(blah, APIMDOMAIN, "/oauth2/token");
  let blah2 = await getOAuth2AccessTokenViaTokenExchange(blah, NHSLOGINIDTOKEN, APIMDOMAIN, "/oauth2/token");
  console.log(blah2);
  //load into JSON object
  let blah3 = JSON.parse(blah2);
  return blah3.access_token;
}
let accessToken = await getAccessToken();
console.log("got access token");

let result = await getPing(drId, accessToken);
console.log(result);
console.log(JSON.stringify(JSON.parse(result.body), null, 2));
