import { handler as processor } from './DefaultRouteProcessor.mjs';


export const handler = async (event) => {
  console.log(JSON.stringify(event));
    try {
        return await processor(event);
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
