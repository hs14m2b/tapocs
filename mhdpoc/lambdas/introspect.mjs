
const REGION = "eu-west-2";

export const handler = async (event) => {
  console.log(JSON.stringify(event));
    try {
        console.log(JSON.stringify(event.headers));
        console.log("reflecting back headers as introspection - to be updated with correct format at some point");
        let introspectionResponse = {};
        // see https://datatracker.ietf.org/doc/html/rfc7662#section-2.2
        // active - true|false - enhanced-introspect-status == "approved"
        // scope - enhanced-introspect-scope
        // client_id
        // token_type
        // exp - calculate from enhanced-introspect-expires-in (string)
        // iat - calculate from enhanced-introspect-expires-in (string) based on 600sec duration
        // nbf - same as iat
        // sub - need to check - probably client_id
        // iss - need to check
        // aud - need to check
        let currentTimeMs = Date.now();
        let currentTimeS = Math.floor(currentTimeMs/1000);
        let expiresInS = parseInt(event.headers["enhanced-introspect-expires-in"]);
        introspectionResponse["active"] = (event.headers["enhanced-introspect-status"] == "approved") ? true : false;
        if (introspectionResponse["active"]){
          introspectionResponse["scope"] = event.headers["enhanced-introspect-scope"];
          introspectionResponse["client_id"] = event.headers["enhanced-introspect-client-id"];
          introspectionResponse["token_type"] = "Bearer";
          introspectionResponse["exp"] = currentTimeS + expiresInS;
          introspectionResponse["iat"] = currentTimeS + expiresInS - 600;
          introspectionResponse["nbf"] = currentTimeS + expiresInS - 600;
          introspectionResponse["sub"] = event.headers["enhanced-introspect-client-id"];
        }

        let response = {
            statusCode: 200,
            "headers": {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(introspectionResponse)
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