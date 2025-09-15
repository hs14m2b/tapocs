var createResource_return_value="";
var createResourceWithRetry_return_value="";

function createResource_promise(){
  this.createResource_call_count++;
  createResource_return_value = this.createResource_return_values[this.createResource_call_count];
  return new Promise(function(resolve, reject){
      resolve(createResource_return_value);
  });
}

function createResourceWithRetry_promise(){
  console.log("running the promise function");
  this.createResourceWithRetry_call_count++;
  createResourceWithRetry_return_value = this.createResourceWithRetry_return_values[this.createResourceWithRetry_call_count];
  return new Promise(function(resolve, reject){
      resolve(createResourceWithRetry_return_value);
  });
}

function createResource_promise_obj(createResource_return_values){
  this.createResource_return_values = createResource_return_values;
  this.createResource_call_count = -1;
  this.promise = createResource_promise;
}

class createResourceWithRetry_promise_obj{
  constructor(createResourceWithRetry_return_values){
    this.createResourceWithRetry_return_values = createResourceWithRetry_return_values;
    this.createResourceWithRetry_call_count = -1;
    this.promise = createResourceWithRetry_promise;
  }
}

function createResource (querystringValues, resourceType, org, APIENVIRONMENT, APIKEYSECRET, APIKNAMEPARAM)
{
  return this.createResource_promise_obj.promise();
}


function createResourceWithRetry(maxDuration, querystringValues, resourceType, org, APIENVIRONMENT, APIKEYSECRET, APIKNAMEPARAM)
{
  return this.createResourceWithRetry_promise_obj.promise();
}

export class create_resource_fhir{
  constructor(createResource_return_values, createResourceWithRetry_return_values){
    console.log("creating the helper");
    this.createResource_promise_obj = new createResource_promise_obj(createResource_return_values);
    this.createResourceWithRetry_promise_obj = new createResourceWithRetry_promise_obj(createResourceWithRetry_return_values);
    this.createResource = createResource;
    this.createResourceWithRetry = createResourceWithRetry;
    this.message = "I exist";
    console.log("finished creating the helper");
  }
}

 
