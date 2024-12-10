import { URLSearchParams } from 'url';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import {
  SecretsManagerClient,
  GetSecretValueCommand,
} from "@aws-sdk/client-secrets-manager";
import { SSMClient, GetParameterCommand } from "@aws-sdk/client-ssm"; // ES Modules import

const REGION = "eu-west-2";
let ssmclient;

const { sign } = jwt;
const HTTPS = "https://";

import https from "node:https";
import { error } from 'console';

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
            reject(err);
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
            reject(err);
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

export const getSecretValue = async (secretName) =>
{
    const secret_name = secretName;
    console.log("looking for secret name " + secret_name);

    const client = new SecretsManagerClient({
      region: "eu-west-2",
    });

    let response;

    try {
      response = await client.send(
        new GetSecretValueCommand({
          SecretId: secret_name,
          VersionStage: "AWSCURRENT", // VersionStage defaults to AWSCURRENT if unspecified
        })
      );
    } catch (error) {
      // For a list of exceptions thrown, see
      // https://docs.aws.amazon.com/secretsmanager/latest/apireference/API_GetSecretValue.html
      throw error;
    }

    const secret = response.SecretString;
    return secret;
}

export const getParamValue = async (paramName) => {
    if (!ssmclient || ssmclient === undefined) ssmclient = new SSMClient({ region: REGION });
    let input = {
        "Name": paramName
    }
    console.log("looking for param name " + paramName);
    const command = new GetParameterCommand(input);
    const response = await ssmclient.send(command);
    console.log("response from param store ", response );
    let returned_parameter = response.Parameter.Value;
    return returned_parameter;
}

export const environmentNeedsAuth = (apienvironment) =>
{
  if (apienvironment == "dev" || apienvironment == "int") return true;
  return false;
}

export const nrlEnvironmentMapping = (apienvironment) =>
{
  if (apienvironment == "int") return "int";
  return "sandbox";
}

/**
  * @param {Object} object
  * @param {string} key
  * @return {any} value
 */
export const getParameterCaseInsensitive = (object, key) => {
  const asLowercase = key.toLowerCase();
  return object[Object.keys(object)
    .find(k => k.toLowerCase() === asLowercase)
  ];
}

export const getDiagnosticReportFromLocalServer = async (pointerUrl, CLIENTCERTIFICATE, CLIENTCERTIFICATEKEY) =>
  {

    //extract the host
    let urlObject = new URL(pointerUrl);
    // request option
    let options = {
      host: urlObject.hostname,
      port: 443,
      method: 'GET',
      path: urlObject.pathname,
      rejectUnauthorized: false,
      key: CLIENTCERTIFICATEKEY,
      cert: CLIENTCERTIFICATE,
      headers: {
        'accept': 'application/fhir+json;version=1'
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
          reject(err);
        });

        //send request
        req.end();
    });
};
