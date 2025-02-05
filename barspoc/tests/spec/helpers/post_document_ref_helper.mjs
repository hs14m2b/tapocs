let newId = "Y05868-70bce845-679e-42ea-a909-30ac78ec1956"

var APIKEYNAME;
var APIKEYKEY;
var apikeykeyLastRetrieved = 0;


export const sendDocRef = async (docRef, APIENVIRONMENT, APIKEYSECRET, APIKNAMEPARAM) =>
{

  //headers.location
  //body = docRef
  let response = {
    "status": 200,
    "headers": {"location": "https://some.location/fhir/R4/DocumentReference/"+newId},
    "body": JSON.stringify(docRef)
  }

  return new Promise(function (resolve, reject) {
    resolve(response);
  })

}
