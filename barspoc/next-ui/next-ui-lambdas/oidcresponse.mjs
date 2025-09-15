import { getSecretValue, getParamValue, environmentNeedsAuth, nrlEnvironmentMapping, createSignedJwtForAuth, createSignedJwtForNhsloginAuth, getOAuth2AccessToken } from './api_common_functions.mjs';
import jwt from 'jsonwebtoken';

const { verify } = jwt;
const NHSLOGINCLIENTID = process.env['NHSLOGINCLIENTID'];
const REDIRECTURI = "https://main-mabr8-barspocui-nextjsfe.nhsdta.com/extapi/oidcresponse";
const NHSLOGINCLIENTKEY = process.env['NHSLOGINCLIENTKEY'];
const APIENVIRONMENT = process.env['APIENVIRONMENT'];
const NHSLOGINOAUTHFQDN = "auth.aos.signin.nhs.uk";
const NHSLOGINOAUTHPATH = "/token";
const JWKSENDPOINT = "https://auth.aos.signin.nhs.uk/.well-known/jwks.json";

var NHSLOGINCLIENTKEYKEY;
var nhsloginkeykeyLastRetrieved = 0;

const HTTPS = "https://";
async function createNHSloginAssertion(){
    let currentTime = Date.now();
    //get the nhslogin key if not present or last retrieved more than 5 minutes ago
    if (!NHSLOGINCLIENTKEYKEY || ((currentTime - nhsloginkeykeyLastRetrieved) > 300000)){
      console.log("retrieving private key from secrets manager");
      NHSLOGINCLIENTKEYKEY = await getSecretValue(NHSLOGINCLIENTKEY);
      //set key last retrieve to now
      nhsloginkeykeyLastRetrieved = currentTime;
    }
    //get api access token
    let signedJwt = createSignedJwtForNhsloginAuth(NHSLOGINCLIENTID, NHSLOGINCLIENTKEYKEY, NHSLOGINOAUTHFQDN, NHSLOGINOAUTHPATH);
    console.log("signed JWT is " + signedJwt);
    return signedJwt;
}

export const handler = async (event) => {
    console.log(JSON.stringify(event));

	let requestParams = {};

    try {

        if (event.requestContext.http.method == "GET") {
            requestParams = event.queryStringParameters;
        }
        else {
            try 
            {
                if (event.isBase64Encoded) {
                    event.body = Buffer.from(event.body, 'base64').toString('utf8');
                  }
                requestParams = JSON.parse(event.body);
            }
            catch (err)
            {
                let searchParams = new URLSearchParams(event.body);
                for(const [key, value] of searchParams) { // each 'entry' is a [key, value] tuple
                    requestParams[key] = value;
                }
            }
        }
    
        let token_response = await getTokens(requestParams);

        console.log(token_response);
        //find the id_token
        let id_token = token_response.body.id_token;
        console.log("id_token is " + id_token);
        //const decoded = jwtDecode(id_token, { header: true});
        const decoded = jwt.decode(id_token);
        console.log("decoded id_token is " + JSON.stringify(decoded));
        let nhsnumber = decoded.nhs_number;
        console.log("nhsnumber is " + nhsnumber);
        //find the cookie that starts with "formdata" from the inbound event.cookies array
        let formdata = "";
        let formData = {};
        try {
            for (let i = 0; i < event.cookies.length; i++) {
                if (event.cookies[i].startsWith("formdata")) {
                    formdata = event.cookies[i];
                    break;
                }
            }
            //strip "formdata=" from the cookie
            formdata = formdata.substring(9);
            //parse the formdata cookie
            formData = JSON.parse(formdata);
        } catch (error) {
            console.log("error getting formdata from cookie");
            console.log(error.message);
        }
        //add the nhsnumber to the formdata
        formData['nhsnumber'] = nhsnumber;
        //add the identity_token to the formdata
        formData['identity_token'] = id_token;
        //add the refresh_token to the formdata
        try {
            formData['refresh_token'] = token_response.body.refresh_token;
        } catch (error) {
            console.log("error getting refresh_token from token response");
            console.log(error.message);
        }
        //stringify the formdata
        formdata = JSON.stringify(formData);
        //return the formdata cookie
        let responseCookies = [
            "formdata=" + formdata + "; Path=/; Secure; SameSite=None"
        ];

        //return the token response
        let response = {
            "statusCode": 302,
            "headers": {
                "location": "https://main-mabr8-barspocui-nextjsfe.nhsdta.com/form1?nhsnumber=" + nhsnumber,
                "Set-Cookie": responseCookies[0]        
            }
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
            body: JSON.stringify({"error": error.message})
        }
        return response;
    }
}

async function getTokens( requestParams)
	{
	let client_id = NHSLOGINCLIENTID;

    let client_assertion = await createNHSloginAssertion();

    let url = HTTPS + NHSLOGINOAUTHFQDN + NHSLOGINOAUTHPATH;
	// form data
	let postData = new URLSearchParams({
		"code": requestParams.code,
		"client_id": client_id,
		"redirect_uri": "https://main-mabr8-barspocui-nextjsfe.nhsdta.com/extapi/oidcresponse",
		"grant_type": "authorization_code",
        "scope": "openid profile email phone",
        "client_assertion_type": "urn:ietf:params:oauth:client-assertion-type:jwt-bearer",
        "client_assertion": client_assertion
        }).toString();
  
	console.log("request POST data is " + JSON.stringify(postData));

   	// request option
    let options = {
        method: 'POST',
        rejectUnauthorized: false,
        headers: {
            'accept': 'application/json',
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: postData
    };
    
    console.log("request options are  " + JSON.stringify(options));
    console.log("url is " + url);
    let fetchResponse = await fetch(url, options);
    if (!fetchResponse.ok) {
      //get the body of the response
      let responseText = await fetchResponse.text();
      console.log(responseText);
      throw new Error(`Response status: ${fetchResponse.status}`);
    }
    else {  
      console.log(fetchResponse.status);
      let response = {
        headers: {}
      }
      for (const pair of fetchResponse.headers.entries()) {
        response.headers[pair[0]] = pair[1];
      }
      response['body'] = await fetchResponse.json()
      return response;
    }
  
}
