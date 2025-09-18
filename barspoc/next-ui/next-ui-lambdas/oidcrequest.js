const NHSLOGINCLIENTID = process.env['NHSLOGINCLIENTID'];
const REDIRECTURI = "https://main-mabr8-barspocui-nextjsfe.nhsdta.com/extapi/oidcresponse";
const APIENVIRONMENT = process.env['APIENVIRONMENT'];

exports.handler = async (event) => {
    console.log(JSON.stringify(event));

    try {
        let redirect_uri = (event.queryStringParameters && event.queryStringParameters.redirect_uri && event.queryStringParameters.redirect_uri.length > 0) ? event.queryStringParameters.redirect_uri: false;
        let state = (event.queryStringParameters && event.queryStringParameters.state && event.queryStringParameters.state.length > 0) ? event.queryStringParameters.state: false;
        let prompt = (event.queryStringParameters && event.queryStringParameters.prompt && event.queryStringParameters.prompt.length > 0) ? event.queryStringParameters.prompt: false;
        let authorization_endpoint= "https://auth.aos.signin.nhs.uk/authorize";
        let vtr = "[\"P9.Cp.Cd\"]"; //this is the vtr for P9 level of assurance
        let qsvalues = {
            client_id: NHSLOGINCLIENTID,
            redirect_uri: (redirect_uri) ? redirect_uri: REDIRECTURI,
            state: (state) ? state: "tempstate",
            scope: "openid profile",
            response_type: "code",
            vtr: vtr,
        }
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
