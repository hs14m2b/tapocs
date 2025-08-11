var updateResource_return_value="";
var updateResourceWithRetry_return_value="";

function updateResource_promise(){
  this.updateResource_call_count++;
  updateResource_return_value = this.updateResource_return_values[this.updateResource_call_count];
  return new Promise(function(resolve, reject){
      resolve(updateResource_return_value);
  });
}

function updateResourceWithRetry_promise(){
  console.log("running the promise function");
  this.updateResourceWithRetry_call_count++;
  updateResourceWithRetry_return_value = this.updateResourceWithRetry_return_values[this.updateResourceWithRetry_call_count];
  return new Promise(function(resolve, reject){
      resolve(updateResourceWithRetry_return_value);
  });
}

function updateResource_promise_obj(updateResource_return_values){
  this.updateResource_return_values = updateResource_return_values;
  this.updateResource_call_count = -1;
  this.promise = updateResource_promise;
}

class updateResourceWithRetry_promise_obj{
  constructor(updateResourceWithRetry_return_values){
    this.updateResourceWithRetry_return_values = updateResourceWithRetry_return_values;
    this.updateResourceWithRetry_call_count = -1;
    this.promise = updateResourceWithRetry_promise;
  }
}

function updateResource (querystringValues, resourceType, org, APIENVIRONMENT, APIKEYSECRET, APIKNAMEPARAM)
{
  return this.updateResource_promise_obj.promise();
}


function updateResourceWithRetry(maxDuration, querystringValues, resourceType, org, APIENVIRONMENT, APIKEYSECRET, APIKNAMEPARAM)
{
  return this.updateResourceWithRetry_promise_obj.promise();
}

export class update_resource_healthlake{
  constructor(updateResource_return_values, updateResourceWithRetry_return_values){
    console.log("creating the helper");
    this.updateResource_promise_obj = new updateResource_promise_obj(updateResource_return_values);
    this.updateResourceWithRetry_promise_obj = new updateResourceWithRetry_promise_obj(updateResourceWithRetry_return_values);
    this.updateResource = updateResource;
    this.updateResourceWithRetry = updateResourceWithRetry;
    this.message = "I exist";
    console.log("finished creating the helper");
  }
}

 
