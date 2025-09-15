var findDocRef_return_value="";
var findDocRefWithRetry_return_value="";

function findDocRef_promise(){
  this.findDocRef_call_count++;
  findDocRef_return_value = this.findDocRef_return_values[this.findDocRef_call_count];
  return new Promise(function(resolve, reject){
      resolve(findDocRef_return_value);
  });
}

function findDocRefWithRetry_promise(){
  console.log("running the promise function");
  this.findDocRefWithRetry_call_count++;
  findDocRefWithRetry_return_value = this.findDocRefWithRetry_return_values[this.findDocRefWithRetry_call_count];
  return new Promise(function(resolve, reject){
      resolve(findDocRefWithRetry_return_value);
  });
}

function findDocRef_promise_obj(findDocRef_return_values){
  this.findDocRef_return_values = findDocRef_return_values;
  this.findDocRef_call_count = -1;
  this.promise = findDocRef_promise;
}

class findDocRefWithRetry_promise_obj{
  constructor(findDocRefWithRetry_return_values){
    this.findDocRefWithRetry_return_values = findDocRefWithRetry_return_values;
    this.findDocRefWithRetry_call_count = -1;
    this.promise = findDocRefWithRetry_promise;
  }
}

function findDocRef (querystringValues, resourceType, org, APIENVIRONMENT, APIKEYSECRET, APIKNAMEPARAM)
{
  return this.findDocRef_promise_obj.promise();
}


function findDocRefWithRetry(maxDuration, querystringValues, resourceType, org, APIENVIRONMENT, APIKEYSECRET, APIKNAMEPARAM)
{
  return this.findDocRefWithRetry_promise_obj.promise();
}

export class find_document_ref_bars_helper{
  constructor(findDocRef_return_values, findDocRefWithRetry_return_values){
    console.log("creating the helper");
    this.findDocRef_promise_obj = new findDocRef_promise_obj(findDocRef_return_values);
    this.findDocRefWithRetry_promise_obj = new findDocRefWithRetry_promise_obj(findDocRefWithRetry_return_values);
    this.findDocRef = findDocRef;
    this.findDocRefWithRetry = findDocRefWithRetry;
    this.message = "I exist";
    console.log("finished creating the helper");
  }
}

 
