// Filename: DefaultRouteProcessor.mjs

export const handler = async (event) => {
  console.log(JSON.stringify(event));
  //reflect the event back
  let reflectedResponse = {
    statusCode: 404,
    "headers": {
        "Content-Type": "application/json"
    },
    body: JSON.stringify(event)
  };
  console.log(JSON.stringify(reflectedResponse));
  return reflectedResponse;

}
