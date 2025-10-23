let newId = "Y05868-70bce845-679e-42ea-a909-30ac78ec1952"

export const postResource = async (resource, resourceType, org, APIENVIRONMENT, APIKEYSECRET, APIKNAMEPARAM) =>
{

  return new Promise(function (resolve, reject) {
    let newResource = JSON.parse(JSON.stringify(resource));
    newResource["id"] = newId;
    let response = {
      "status": 200,
      "headers": {"location": "https://some.location/fhir/R4/"+resourceType+"/"+newId},
      "body": JSON.stringify(newResource)
    }
    resolve(response);
  });
}
 
