function sleep(ms) {
    console.log("sleeping for " + ms + "ms");
    return new Promise((resolve) => { setTimeout(resolve, ms); });
}
exports.handler = async (event) => {
    console.log(JSON.stringify(event));
    try {
        console.log(event.body);
        let requestParams = {};
        let bodyParams = (event.body!="") ? new URLSearchParams(event.body) : new URLSearchParams();
        for(const [key, value] of bodyParams) { // each 'entry' is a [key, value] tuple
            requestParams[key] = value;
        }
        console.log(JSON.stringify(requestParams));
        let result = (Math.random() > 0.5) ? "true" : "false";
        if (requestParams.familyname && requestParams.favcolour && requestParams.familyname.toLowerCase() == requestParams.favcolour.toLowerCase()) {
            result = "true";
            console.log("family name and favcolour match so true");
        }
        //sleep for a random period of time up to 10 sec
        await sleep(Math.random() * 10000);
        //occasionally throw an error
        if (Math.random() < 0.2) throw new Error("synthetic error");
        let response = {
            statusCode: 200,
            "headers": {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({"result": result})
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
            body: JSON.stringify({ "result": false })
        }
        return response;
    }
}