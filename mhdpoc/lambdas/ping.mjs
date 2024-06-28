
export const handler = async (event) => {
  console.log(JSON.stringify(event));
    try {
        let response = {
            statusCode: 200,
            "headers": {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(event)
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
            body: JSON.stringify({ "result": error.message })
        }
        return response;
    }
}