
exports.handler = async (event) => {
    console.log(JSON.stringify(event));
    let result = (Math.random() > 0.5) ? "true" : "false";
    let response = {
        statusCode: 200,
        "headers": {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({"result": result})
    };
    console.log(JSON.stringify(response));
    return response;
}