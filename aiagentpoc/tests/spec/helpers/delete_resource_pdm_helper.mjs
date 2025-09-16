var deleteResource_return_value="";

function deleteResource_promise(){
  console.log("running the deleteResource_promise function");
  this.deleteResource_call_count++;
  deleteResource_return_value = this.deleteResource_return_values[this.deleteResource_call_count];
  return new Promise(function(resolve, reject){
      resolve(deleteResource_return_value);
  });
}

class deleteResource_promise_obj{
  constructor(deleteResource_return_values){
    this.deleteResource_return_values = deleteResource_return_values;
    this.deleteResource_call_count = -1;
    this.promise = deleteResource_promise;
  }
}

function deleteResource(id, versionId, resourceType, headersJson, org, APIENVIRONMENT, APIKEYSECRET, APIKNAMEPARAM) 
{
  console.log("in the deleteResource helper function");
  //log all the input parameters
  console.log("id: " + id);
  console.log("versionId: " + versionId);
  console.log("resourceType: " + resourceType);
  console.log("headersJson: " + JSON.stringify(headersJson));
  console.log("org: " + org);
  console.log("APIENVIRONMENT: " + APIENVIRONMENT);
  console.log("APIKEYSECRET: " + APIKEYSECRET);
  console.log("APIKNAMEPARAM: " + APIKNAMEPARAM);
  return this.deleteResource_promise_obj.promise();
}
    
export class delete_resource_pdm{
  constructor(deleteResource_return_values){
    console.log("creating the helper");
    this.deleteResource_promise_obj = new deleteResource_promise_obj(deleteResource_return_values);
    this.deleteResource = deleteResource;
    this.message = "I exist";
    console.log("finished creating the delete helper");
  }
}

 
