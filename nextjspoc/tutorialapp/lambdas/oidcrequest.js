exports.handler = async (event) => {
    console.log(JSON.stringify(event));

    try {
        let redirect_uri = (event.queryStringParameters && event.queryStringParameters.redirect_uri && event.queryStringParameters.redirect_uri.length > 0) ? event.queryStringParameters.redirect_uri: false;
        let state = (event.queryStringParameters && event.queryStringParameters.state && event.queryStringParameters.state.length > 0) ? event.queryStringParameters.state: false;
        let prompt = (event.queryStringParameters && event.queryStringParameters.prompt && event.queryStringParameters.prompt.length > 0) ? event.queryStringParameters.prompt: false;
        let endpoint = (event.queryStringParameters && event.queryStringParameters.endpoint && event.queryStringParameters.endpoint.length > 0) ? event.queryStringParameters.endpoint: "v2";
        let authorization_endpoint= (endpoint == "v2") ? "https://login.microsoftonline.com/37c354b2-85b0-47f5-b222-07b48d774ee3/oauth2/v2.0/authorize" : "https://login.microsoftonline.com/37c354b2-85b0-47f5-b222-07b48d774ee3/oauth2/authorize";
        let qsvalues = {
            client_id: "66dcf442-2933-4d84-b50d-30c7404632b6",
            redirect_uri: (redirect_uri) ? redirect_uri: "https://main-nextjsfe.nhsdta.com/extapi/oidcresponse",
            state: (state) ? state: "tempstate",
            scope: "openid profile email phone",
            response_type: "code",
            claims: JSON.stringify({
                "id_token" : {
                    "auth_time" :  { "essential" : true },
                    "CIS2UID" :  { "essential" : false }
                }
            })
        }
        qsvalues['state'] = qsvalues['state'] + "|" + endpoint;
        if (prompt) qsvalues['prompt'] = prompt;
        let searchparams = new URLSearchParams(qsvalues).toString();
        let response = {
            "statusCode": 302,
            "headers": {
                "Access-Control-Allow-Origin": "*",
                "Location": authorization_endpoint + "?" + searchparams
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
