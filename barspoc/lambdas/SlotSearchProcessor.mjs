
async function searchHealthlake(event, healthlakeSearchHelper, APIKEYSECRET, APIENVIRONMENT, APIKNAMEPARAM){
  let maxDuration=25000;
  try {
    console.log("searching healthlake")
    let healthlakeresponse = await healthlakeSearchHelper.searchResourceWithRetry(maxDuration,event.queryStringParameters, "Slot", "Y05868", APIENVIRONMENT, APIKEYSECRET, APIKNAMEPARAM);
    console.log("healthlake response is " + JSON.stringify(healthlakeresponse));
    let searchsetBundle = JSON.parse(healthlakeresponse.body);
    if (searchsetBundle.entry) searchsetBundle.total = searchsetBundle.entry.length;
    return searchsetBundle;
  } catch (error) {
    console.log(error);
    return false;
  }
}

export const handler = async (event, healthlakeSearchHelper, getParameterCaseInsensitive, APIKEYSECRET, APIENVIRONMENT, APIKNAMEPARAM) => {

  console.log(JSON.stringify(event));
    try {
        //try healthlake
        try {
          let searchsetBundle = await searchHealthlake(event, healthlakeSearchHelper, APIKEYSECRET, APIENVIRONMENT, APIKNAMEPARAM);
          if (searchsetBundle){
            //return the searchset
            let healthlakeResponse = {
              statusCode: 200,
              "headers": {
                  "Content-Type": "application/fhir+json",
                  "X-Response-Source": "Healthlake"
              },
              body: JSON.stringify(searchsetBundle)
            };
            console.log(JSON.stringify(healthlakeResponse));
            return healthlakeResponse;
          }
          else {
            console.log("searchHealthlake failed");
            let response = {
              statusCode: 500,
              "headers": {
                  "Content-Type": "application/json"
              },
              body: JSON.stringify({ "result": "searchHealthlake failed" })
            }
            return response;
          }
        } catch (error) {
          console.log("caught an unexpected error processing data from healthlake");
          throw error;
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
