import { createSignedJwtForAuth, getOAuth2AccessToken, getOAuth2AccessTokenViaTokenExchange } from '../api_common_functions.mjs';

import { readFileSync } from 'node:fs';

const apiClientPrivateKey = readFileSync('../../certs/mhdtest001.key', 'utf8');

import { URLSearchParams } from 'url';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
const { sign } = jwt;
const HTTPS = "https://";
const APIMDOMAIN = "int.api.service.nhs.uk";
const ODSCode = "Y05868";
const OAuthAPIKey = "JE4ESpy5NzFyG5n4U6pKqk8HGXeRjLhZ"; //API Key for BaRS Demonstrator client
const AUTHPATH = "/oauth2-mock/token";
const AUTHCODE = "841619b2-834c-46dc-b4aa-23b67d81c5f2.779788bd-6630-442d-888d-191f6b002f15.a22889a8-598c-4df3-84d7-aef718490095";
// use https://demoapiconsdemo.nhsdta.com/client to get the token
const NHSLOGINIDTOKEN = "";

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
  APIMDOMAIN, AUTHPATH);
  let tokenResponse = JSON.parse(await getNHSLoginMockIDToken()).id_token;
  console.log("tokenResponse is " + tokenResponse);
  //console.log(blah);
  //let blah2 = await getOAuth2AccessToken(blah, APIMDOMAIN, "/oauth2/token");
  let blah2 = await getOAuth2AccessTokenViaTokenExchange(blah, tokenResponse, APIMDOMAIN, AUTHPATH);
  console.log(blah2);
  //load into JSON object
  let blah3 = JSON.parse(blah2);
  return blah3.access_token;
}

async function getNHSLoginMockIDToken ()
{
  // form data
  let postData = new URLSearchParams({
        "grant_type": "authorization_code",
        "code": AUTHCODE,
        "redirect_uri": "https://example.org",
        "client_id": "pytest-nhsd-apim",
        "client_secret": "8332c425-d69e-46ef-9241-69998fa81018"
      }).toString();

    console.log("request POST data is " + JSON.stringify(postData));
    // request option
  let options = {
        host: "identity.ptl.api.platform.nhs.uk",
        port: 443,
        method: 'POST',
        path: "/realms/NHS-Login-mock-int/protocol/openid-connect/token",
        rejectUnauthorized: false,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': postData.length
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
                  resolve(result);
              });
              res.on('error', function (err) {
                  console.log(err);
                  reject(err);
              })
          });

          // req error
          req.on('error', function (err) {
            console.log(err);
            reject(err);
          });

          //send request with the postData form
          req.write(postData);
          req.end();
      });
};



let accessToken = await getAccessToken();
console.log("got access token");

let result = await getPing(drId, accessToken);
console.log(result);
console.log(JSON.stringify(JSON.parse(result.body), null, 2));
