
export const handler = async (event) => {
    console.log(JSON.stringify(event));

    let example_request = {
        "version": "2.0",
        "routeKey": "POST /v2/notifications/email",
        "rawPath": "/v2/notifications/email",
        "rawQueryString": "",
        "headers": {
            "accept": "application/json, text/plain, */*",
            "authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiI1ZTU1NmRiOS1iNzFiLTQ3MmEtOWJhMC02MjdiYzI5NTQ4NDQiLCJpYXQiOjE2Nzg5NzczMDd9.5bMlXZ7efs0Lo_IUdETn9JEiB_qQ3fF-kU3UIhKan54",
            "content-length": "261",
            "content-type": "application/json",
            "host": "main-queuescaling-notifications.nhsdta.com",
            "user-agent": "NOTIFY-API-NODE-CLIENT/7.0.0",
            "x-amzn-trace-id": "Root=1-64132918-5995ac95623583bc0cf7ad0a",
            "x-forwarded-for": "86.138.89.219",
            "x-forwarded-port": "443",
            "x-forwarded-proto": "https"
        },
        "requestContext": {
            "accountId": "865198111306",
            "apiId": "d10a6g8tic",
            "domainName": "main-queuescaling-notifications.nhsdta.com",
            "domainPrefix": "main-queuescaling-notifications",
            "http": {
                "method": "POST",
                "path": "/v2/notifications/email",
                "protocol": "HTTP/1.1",
                "sourceIp": "86.138.89.219",
                "userAgent": "NOTIFY-API-NODE-CLIENT/7.0.0"
            },
            "requestId": "B4Nb6iwNLPEEMww=",
            "routeKey": "POST /v2/notifications/email",
            "stage": "$default",
            "time": "16/Mar/2023:14:35:04 +0000",
            "timeEpoch": 1678977304792
        },
        "body": "{\"template_id\":\"b844408b-e85d-470d-9d56-49bbc20f282d\",\"email_address\":\"matthewandkaren@hotmail.com\",\"personalisation\":{\"title\":\"Mr\",\"familyname\":\"Brown\",\"givenname\":\"Matthew\",\"nhsnumberformatted\":\"9999998765\"},\"reference\":\"4d349ff1-fc16-4e2f-9002-f7ab3d8286ec\"}",
        "isBase64Encoded": false
    };
    
    let response_body = {
        "message": "hello world"
    };

    let response = {
        "statusCode": 200,
        "headers": {
            "Content-Type": "application/json"
        },
        "body": JSON.stringify(response_body)
    }
    return response;
}