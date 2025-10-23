var searchResource_return_value="";
var searchResourceWithRetry_return_value="";
var getResource_return_value="";
var getResourcePatient_return_value="";

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

function getResource_promise(){
  console.log("running the getResource_promise function");
  this.getResource_call_count++;
  getResource_return_value = this.getResource_return_values[this.getResource_call_count];
  return new Promise(function(resolve, reject){
      resolve(getResource_return_value);
  });
}

function getResourcePatient_promise(){
  console.log("running the getResourcePatient_promise function");
  this.getResourcePatient_call_count++;
  getResourcePatient_return_value = this.getResourcePatient_return_values[this.getResourcePatient_call_count];
  return new Promise(function(resolve, reject){
      resolve(getResourcePatient_return_value);
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

class getResource_promise_obj{
  constructor(getResource_return_values){
    this.getResource_return_values = getResource_return_values;
    this.getResource_call_count = -1;
    this.promise = getResource_promise;
  }
}

class getResourcePatient_promise_obj{
  constructor(getResourcePatient_return_values){
    this.getResourcePatient_return_values = getResourcePatient_return_values;
    this.getResourcePatient_call_count = -1;
    this.promise = getResourcePatient_promise;
  }
}

function searchResource (querystringValues, resourceType, org, APIENVIRONMENT, APIKEYSECRET, APIKNAMEPARAM)
{
  return this.searchResource_promise_obj.promise();
}


function searchResourceWithRetry(maxDuration, querystringValues, resourceType, org, APIENVIRONMENT, APIKEYSECRET, APIKNAMEPARAM)
{
  return this.searchResourceWithRetry_promise_obj.promise();
}

function getResource(id, resourceType, org, APIENVIRONMENT, APIKEYSECRET, APIKNAMEPARAM) 
{
    return this.getResource_promise_obj.promise();
}
  
function getResourcePatient(id, resourceType, org, APIENVIRONMENT, APIKEYSECRET, APIKNAMEPARAM, identity_token) 
{
    return this.getResourcePatient_promise_obj.promise();
}
  
export class search_resource_healthlake{
  constructor(searchResource_return_values, searchResourceWithRetry_return_values, getResource_return_values, getResourcePatient_return_values){
    console.log("creating the helper");
    this.searchResource_promise_obj = new searchResource_promise_obj(searchResource_return_values);
    this.searchResourceWithRetry_promise_obj = new searchResourceWithRetry_promise_obj(searchResourceWithRetry_return_values);
    this.getResource_promise_obj = new getResource_promise_obj(getResource_return_values);
    this.getResourcePatient_promise_obj = new getResourcePatient_promise_obj(getResourcePatient_return_values);
    this.searchResource = searchResource;
    this.searchResourceWithRetry = searchResourceWithRetry;
    this.getResource = getResource;
    this.getResourcePatient = getResourcePatient;
    this.message = "I exist";
    console.log("finished creating the helper");
  }
}

 
