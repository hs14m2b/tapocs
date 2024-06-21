import diagnosticreport001 from './data/diagnosticreport001.json' assert { type: 'json' };

export const handler = async (event) => {
  console.log(JSON.stringify(event));
  console.log(JSON.stringify(diagnosticreport001));
    try {
        //get the diagnosticreportid path parameter and put into template
        const diagnosticreportid = event.pathParameters.diagnosticreportid;


        let response = {
            statusCode: 200,
            "headers": {
                "Content-Type": "application/fhir+json"
            },
            body: JSON.stringify(diagnosticreport001)
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