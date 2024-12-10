
export const putResource = async (resource, resourceType, org, APIENVIRONMENT, APIKEYSECRET, APIKNAMEPARAM) =>
{
  let resourceId = resource.id;


  return new Promise(function (resolve, reject) {
    let response = {
      "status": 200,
      "headers": {"location": "https://some.location/fhir.R4/"+ resourceType + "/" +  resourceId},
      "body": JSON.stringify(resource)
    }
    resolve(response);
  });
}
