const serverless = require('serverless-http');
const server = require('./app');
const handler = serverless(server);
module.exports.server = async (event, context) => {
    console.log(JSON.stringify(event));
    console.log("rewriting the path");
    console.log("path is "+ event["path"]);
    event["path"] = event["path"].substring(5);
    console.log("path is "+ event["path"]);
    return await handler(event, context);
};