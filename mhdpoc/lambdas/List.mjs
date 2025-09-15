import { getResource } from './get_resource_pdm.mjs';

const APIENVIRONMENT = process.env['APIENVIRONMENT'];
const APIKEYSECRET = process.env['APIKEYSECRET'];
const APIKNAMEPARAM = process.env['APIKNAMEPARAM'];

export const handler = async (event) => {
    console.log(JSON.stringify(event));
    try {
        console.log(event.body);

        //get the dmid path parameter and put into template
        const listid = event.pathParameters.listid;

        //get from healthlake
        console.log("getting resource from healthlake")
        let healthlakeresponse = await getResource(listid, "List", "Y05868", APIENVIRONMENT, APIKEYSECRET, APIKNAMEPARAM);
        console.log("healthlake response is " + JSON.stringify(healthlakeresponse));

        let response = {
          statusCode: healthlakeresponse.status,
          "headers": {
              "Content-Type": "application/fhir+json"
          },
          body: healthlakeresponse.body
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
