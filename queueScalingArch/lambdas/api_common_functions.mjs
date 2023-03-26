import jwt from 'jsonwebtoken';
const { sign } = jwt;
import { v4 as uuidv4 } from 'uuid';
const HTTPS = "https://";
import { URLSearchParams } from 'url';

let https;
try {
  https = await import('node:https');
} catch (err) {
  console.log('https support is disabled!');
}

export const createSignedJwtForAuth = (apiKey, kid, privatekey, oauth_fqdn, oauth_auth_path) =>
{

	let jwtid = uuidv4();
	let expiresIn = 300;
    let client_token_sign_options = { 
		"algorithm": "RS512",
		"subject": apiKey,
		"issuer": apiKey,
		"jwtid": jwtid,
		"expiresIn": expiresIn,
    "keyid": kid
	};
	let client_token_payload = {
        "aud": HTTPS + oauth_fqdn + oauth_auth_path
    };
	let client_token = sign(client_token_payload, privatekey, client_token_sign_options);

    return client_token;
};

export const getOAuth2AccessToken = async (signed_jwt, oauth_fqdn, oauth_auth_path) =>
{

	// form data
	let postData = new URLSearchParams({
        "grant_type": "client_credentials",
        "client_assertion_type": "urn:ietf:params:oauth:client-assertion-type:jwt-bearer",
        "client_assertion": signed_jwt
      }).toString();
  
    //console.log("request POST data is " + JSON.stringify(postData));
    // request option
	let options = {
        host: oauth_fqdn,
        port: 443,
        method: 'POST',
        path: oauth_auth_path,
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
          });
           
          //send request with the postData form
          req.write(postData);
          req.end();
      });
};

export const getOAuth2AccessTokenViaTokenExchange = async (signed_jwt, id_token, oauth_fqdn, oauth_auth_path) =>
{

	// form data
	let postData = new URLSearchParams({
        "grant_type": "urn:ietf:params:oauth:grant-type:token-exchange",
        "client_assertion_type": "urn:ietf:params:oauth:client-assertion-type:jwt-bearer",
        "client_assertion": signed_jwt,
        "subject_token_type": "urn:ietf:params:oauth:token-type:id_token",
        "subject_token": id_token
      }).toString();
  
    //console.log("request POST data is " + JSON.stringify(postData));
    // request option
	let options = {
        host: oauth_fqdn,
        port: 443,
        method: 'POST',
        path: oauth_auth_path,
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
          });
           
          //send request with the postData form
          req.write(postData);
          req.end();
      });
};

export const getPatientDemographicInfo = async (nhs_number, access_token, pds_fhir_fqdn, pds_fhir_path) =>
{
  //with the Patient path!
	let XRequestID = uuidv4();

  // request option
let options = {
    host: pds_fhir_fqdn,
    port: 443,
    method: 'GET',
    path: pds_fhir_path + nhs_number,
    rejectUnauthorized: false,
    headers: {
      'Authorization': 'Bearer '+ access_token,
      'accept': 'application/fhir+json',
      "X-Request-ID": XRequestID
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
      });
       
      //send request
      req.end();
  });
}