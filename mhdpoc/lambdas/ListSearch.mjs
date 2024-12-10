import { searchResourceWithRetry } from './search_resource_healthlake.mjs'

const APIENVIRONMENT = process.env['APIENVIRONMENT'];
const APIKEYSECRET = process.env['APIKEYSECRET'];
const APIKNAMEPARAM = process.env['APIKNAMEPARAM'];


async function searchHealthlake(event){
  let maxDuration=25000;
  try {
    console.log("searching healthlake")
    let healthlakeresponse = await searchResourceWithRetry(maxDuration,event.queryStringParameters, "List", "Y05868", APIENVIRONMENT, APIKEYSECRET, APIKNAMEPARAM);
    console.log("healthlake response is " + JSON.stringify(healthlakeresponse));
    let searchsetBundle = JSON.parse(healthlakeresponse.body);
    if (searchsetBundle.entry) searchsetBundle.total = searchsetBundle.entry.length;
    return searchsetBundle;
  } catch (error) {
    console.log(error);
    return false;
  }
}

export const handler = async (event) => {
    console.log(JSON.stringify(event));
    try {
        console.log(event.body);

        //try healthlake
        let searchsetBundle = await searchHealthlake(event);
        if (searchsetBundle){
          //return the searchset
          let healthlakeResponse = {
            statusCode: 200,
            "headers": {
                "Content-Type": "application/fhir+json"
            },
            body: JSON.stringify(searchsetBundle)
          };
          console.log(JSON.stringify(healthlakeResponse));
          return healthlakeResponse;
        }

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
