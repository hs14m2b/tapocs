const serialize = require("cookie").serialize;
const uuidv4 = require('uuid').v4;
const SESSIONCOOKIENAME = "sessiondata";
const NHSMAILSECRETPARAM = process.env["NHSMAILSECRETPARAM"];
const AWS = require('aws-sdk');
const ssm = new AWS.SSM();
const ssmparams = {
	Name: NHSMAILSECRETPARAM,
	WithDecryption: true
};
var nhsmailsecret = "";

function sleep(ms) {
    console.log("sleeping for " + ms + "ms");
    return new Promise((resolve) => { setTimeout(resolve, ms); });
}
exports.handler = async (event) => {
    console.log(JSON.stringify(event));
    try {
        nhsmailsecret = (nhsmailsecret=="") ? await getNhsMailParameter(ssmparams): nhsmailsecret;
    } catch (error) {
        console.log("failed to retrieve nhsmail secret key");
        console.log(error.message);
        let response = {
            statusCode: 500,
            "headers": {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({"error": error.message})
        }
        return response;
    }


    try {
        console.log(event.body);
        let requestParams = {};
        let bodyParams = (event.body!="") ? new URLSearchParams(event.body) : new URLSearchParams();
        for(const [key, value] of bodyParams) { // each 'entry' is a [key, value] tuple
            requestParams[key] = value;
        }
        console.log(JSON.stringify(requestParams));
        //check if GET as opposed to POST
        if (event.requestContext.http.method && event.requestContext.http.method == "GET" && event.queryStringParameters)
        {
            for(const [key, value] of Object.entries(event.queryStringParameters)) { // each 'entry' is a [key, value] tuple
                requestParams[key] = value;
            }
        }
        console.log(JSON.stringify(requestParams));

        const cookie = serialize(SESSIONCOOKIENAME, uuidv4()+"-"+JSON.stringify(requestParams), {
            httpOnly: false,
            path: "/",
        });
        let response = {
            "statusCode": 200,
            "cookies": [cookie],
            "headers": {
                "Content-Type": "application/json"
            },
            "body": JSON.stringify(requestParams)
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

async function getNhsMailParameter(){
    ssm.getParameter(ssmparams).promise();
}