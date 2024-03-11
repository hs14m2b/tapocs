
const ROLEARN = process.env["ROLEARN"];


export const handler = async (event) => {
  console.log(JSON.stringify(event));
    try {
      const { datastoreEndpoint } = event;
        let iat = Math.round(Date.now()/1000) -60;
/*

example event
{
    "datastoreEndpoint": "https://healthlake.us-east-1.amazonaws.com/datastore/7b4ecba72dc7fef0b302931ab19d5f32/r4/",
    "bearerToken": "THISISTHETOKEN",
    "operationName": "SearchWithGet",
    "datastoreId": "7b4ecba72dc7fef0b302931ab19d5f32",
    "datastoreTypeVersion": "R4",
    "datastoreName": "healthlakepoc-main-mabr8-202403081735"
}


from https://docs.aws.amazon.com/healthlake/latest/devguide/smart-on-fhir-access.html#smart-on-fhir-lambda-example
{
  "authPayload": {
    "iss": "https://authorization-server-endpoint/oauth2/token", # The issuer identifier of the authorization server
    "aud": "https://healthlake.your-region.amazonaws.com/datastore/your-datastore-id/r4/", # Required, data store endpoint
    "iat": 1677115637,  # Identifies the time at which the token was issued
    "nbf": 1677115637,  # Required, the earliest time the JWT would be valid
    "exp": 1997877061,  # Required, the time at which the JWT is no longer valid
    "isAuthorized": "true",  # Required, boolean indicating the request has been authorized
    "uid": "100101",  # Unique identifier returned by the auth server
    "scope": "system/*.*" # Required, the scope of the request
  },
  "iamRoleARN": "iam-role-arn" #Required, IAM role to complete the request
}

*/
        
        
        let auth_payload = {
          "iss": "https://endpoint",
          "aud": datastoreEndpoint,
          "nbf": iat,
          "iat": iat,
          "exp": iat + (60*60),
          "isAuthorized": "true",
          "uid": "100101",  //# Unique identifier returned by the auth server
          "scope": "system/*.*"
        }
        let response = {"authPayload": auth_payload, "iamRoleARN": ROLEARN}
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