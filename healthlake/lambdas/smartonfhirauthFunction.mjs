
const ROLEARN = process.env["ROLEARN"];


export const handler = async (event) => {
  console.log(JSON.stringify(event));
    try {
        console.log(event.body);
        let iat = Math.round(Date.now()/1000);
        let auth_payload = {
          nbf: iat,
          iat: iat,
          exp: iat + (60*60),
          isAuthorized: true,
          aud: "replacewithhealthlakedatastoreendpoint",
          scope: "system/*.*"
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