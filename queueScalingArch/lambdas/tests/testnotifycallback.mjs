import { handler } from "../notifycallback.mjs";
process.env["REQUESTSTABLENAME"] = "main-queuescaling-requestsTable";
let event = {
    "version": "2.0",
    "routeKey": "POST /extapi/notify/callback",
    "rawPath": "/extapi/notify/callback",
    "rawQueryString": "",
    "headers": {
        "accept": "*/*",
        "accept-encoding": "gzip, deflate",
        "authorization": "Bearer THISISTHEBEARERTOKEN",
        "content-length": "429",
        "content-type": "application/json",
        "host": "main-queuescaling-callbacks.nhsdta.com",
        "user-agent": "python-requests/2.28.1",
        "x-amzn-trace-id": "Root=1-64076b9e-12af50fa15d05a4f18915e19",
        "x-forwarded-for": "52.51.250.21",
        "x-forwarded-port": "443",
        "x-forwarded-proto": "https"
    },
    "requestContext": {
        "accountId": "865198111306",
        "apiId": "kqvw16rleg",
        "domainName": "main-queuescaling-callbacks.nhsdta.com",
        "domainPrefix": "main-queuescaling-callbacks",
        "http": {
            "method": "POST",
            "path": "/extapi/notify/callback",
            "protocol": "HTTP/1.1",
            "sourceIp": "52.51.250.21",
            "userAgent": "python-requests/2.28.1"
        },
        "requestId": "Ba3A2jJ9rPEEPcA=",
        "routeKey": "POST /extapi/notify/callback",
        "stage": "$default",
        "time": "07/Mar/2023:16:51:42 +0000",
        "timeEpoch": 1678207902757
    },
    "body": "{\"id\": \"f9bf6e50-cd1d-4021-b35c-9778d3ca4b92\", \"reference\": \"12345.1678216759967db2f9-249e-494f-ba3a-060fb577bee9001ROUTEPLAN\", \"to\": \"matthewandkaren@hotmail.com\", \"status\": \"delivered\", \"created_at\": \"2023-03-07T16:51:41.754634Z\", \"completed_at\": \"2023-03-07T16:51:42.580612Z\", \"sent_at\": \"2023-03-07T16:51:41.945035Z\", \"notification_type\": \"email\", \"template_id\": \"b844408b-e85d-470d-9d56-49bbc20f282d\", \"template_version\": 1}",
    "isBase64Encoded": false
};

let response = await handler(event);
