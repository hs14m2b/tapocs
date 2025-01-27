var searchResource_return_value="";
var searchResourceWithRetry_return_value="";

function searchResource_promise(){
  this.searchResource_call_count++;
  searchResource_return_value = this.searchResource_return_values[this.searchResource_call_count];
  return new Promise(function(resolve, reject){
      resolve(searchResource_return_value);
  });
}

function searchResourceWithRetry_promise(){
  console.log("running the promise function");
  this.searchResourceWithRetry_call_count++;
  searchResourceWithRetry_return_value = this.searchResourceWithRetry_return_values[this.searchResourceWithRetry_call_count];
  return new Promise(function(resolve, reject){
      resolve(searchResourceWithRetry_return_value);
  });
}

function searchResource_promise_obj(searchResource_return_values){
  this.searchResource_return_values = searchResource_return_values;
  this.searchResource_call_count = -1;
  this.promise = searchResource_promise;
}

class searchResourceWithRetry_promise_obj{
  constructor(searchResourceWithRetry_return_values){
    this.searchResourceWithRetry_return_values = searchResourceWithRetry_return_values;
    this.searchResourceWithRetry_call_count = -1;
    this.promise = searchResourceWithRetry_promise;
  }
}

const searchResource =  (querystringValues, resourceType, org, APIENVIRONMENT, APIKEYSECRET, APIKNAMEPARAM) =>
{
  return this.searchResource_promise_obj;
}


function searchResourceWithRetry(maxDuration, querystringValues, resourceType, org, APIENVIRONMENT, APIKEYSECRET, APIKNAMEPARAM)
{
  return this.searchResourceWithRetry_promise_obj.promise();
}

export class search_resource_healthlake{
  constructor(searchResource_return_values, searchResourceWithRetry_return_values){
    console.log("creating the helper");
    this.searchResource_promise_obj = new searchResource_promise_obj(searchResource_return_values);
    this.searchResourceWithRetry_promise_obj = new searchResourceWithRetry_promise_obj(searchResourceWithRetry_return_values);
    this.searchResourceWithRetry = searchResourceWithRetry;
    this.searchResource = searchResource;
    this.message = "I exist";
  }
}

