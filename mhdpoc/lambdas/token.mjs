import { gunzipSync } from 'zlib';
const APIENVIRONMENT = process.env['APIENVIRONMENT'];
const OAUTH_FQDN = APIENVIRONMENT + ".api.service.nhs.uk";
const OAUTH_PATH = "/oauth2/token";
import { getOAuth2AccessToken } from './api_common_functions.mjs';

export const handler = async (event) => {
  console.log(JSON.stringify(event));
    try {
      //get the body and pass it to the actual API-M oauth2 service
      //check if gzipped body first
      if (event.headers["content-encoding"] == "gzip")
      {
        let unzippedBody = gunzipSync(Buffer.from(event.body, "base64")).toString("utf-8");
        event.body = unzippedBody;
        event.isBase64Encoded = false;
      }
      console.log(event.body);
      let plain = (event.isBase64Encoded) ? Buffer.from(event.body, 'base64').toString('utf8') : event.body;
      let client_assertion = (new URLSearchParams(plain)).get("client_assertion");
      let tokenResponse = await getOAuth2AccessToken(client_assertion, OAUTH_FQDN, OAUTH_PATH);
      console.log(JSON.stringify(tokenResponse));

      let response = {
          statusCode: 200,
          "headers": {
              "Content-Type": "application/json"
          },
          body: tokenResponse
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
