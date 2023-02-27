
exports.handler = async (event) => {
    console.log(JSON.stringify(event));
    try {
        const request = event.Records[0].cf.request;
        let uri = request.uri;
        console.log("uri is " + uri);
        let regex = /^\/[A-Z]\d{4,8}[\d\/]$/;
        let isStart = uri.match(regex);
        console.log("isStart is " + isStart);
        if (isStart != null) {
            //remove start and end /
            let odscode = isStart[0].replaceAll("/", "");
            console.log("odscode is " + odscode);
            let redirectResponse = {
                "status": 302,
                "headers": {
                    'location': [{
                        key: 'Location',
                        value: '/extapi/startsession/' + odscode,
                    }]
                }
            };
            return redirectResponse;
        }
        return request;
    } catch (error) {
        console.log("caught error " + error.message);
        return {};
    }
};