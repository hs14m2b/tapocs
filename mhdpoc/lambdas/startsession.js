const serialize = require("cookie").serialize;
const uuidv4 = require('uuid').v4;
const SESSIONCOOKIENAME = "sessiondata";

exports.handler = async (event) => {
    console.log(JSON.stringify(event));
    try {
        const odscode=event.pathParameters.odsinfo;
        const cookie = serialize(SESSIONCOOKIENAME, uuidv4()+"-"+odscode, {
            httpOnly: false,
            path: "/",
        });
        let response = {
            statusCode: 302,
            "headers": {
                "Set-Cookie": cookie,
                "Location": "/index.html"
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
            body: JSON.stringify({ "result": false, "message": error.message })
        }
        return response;
    }
}