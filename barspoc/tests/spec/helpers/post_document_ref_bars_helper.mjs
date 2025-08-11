var sendDocRef_return_value="";
var sendDocRefWithRetry_return_value="";

function sendDocRef_promise(){
  this.sendDocRef_call_count++;
  sendDocRef_return_value = this.sendDocRef_return_values[this.sendDocRef_call_count];
  return new Promise(function(resolve, reject){
      resolve(sendDocRef_return_value);
  });
}

function sendDocRefWithRetry_promise(){
  console.log("running the promise function");
  this.sendDocRefWithRetry_call_count++;
  sendDocRefWithRetry_return_value = this.sendDocRefWithRetry_return_values[this.sendDocRefWithRetry_call_count];
  return new Promise(function(resolve, reject){
      resolve(sendDocRefWithRetry_return_value);
  });
}

function sendDocRef_promise_obj(sendDocRef_return_values){
  this.sendDocRef_return_values = sendDocRef_return_values;
  this.sendDocRef_call_count = -1;
  this.promise = sendDocRef_promise;
}

class sendDocRefWithRetry_promise_obj{
  constructor(sendDocRefWithRetry_return_values){
    this.sendDocRefWithRetry_return_values = sendDocRefWithRetry_return_values;
    this.sendDocRefWithRetry_call_count = -1;
    this.promise = sendDocRefWithRetry_promise;
  }
}

function sendDocRef (querystringValues, resourceType, org, APIENVIRONMENT, APIKEYSECRET, APIKNAMEPARAM)
{
  return this.sendDocRef_promise_obj.promise();
}


function sendDocRefWithRetry(maxDuration, querystringValues, resourceType, org, APIENVIRONMENT, APIKEYSECRET, APIKNAMEPARAM)
{
  return this.sendDocRefWithRetry_promise_obj.promise();
}

export class post_document_ref_bars_helper{
  constructor(sendDocRef_return_values, sendDocRefWithRetry_return_values){
    console.log("creating the helper");
    this.sendDocRef_promise_obj = new sendDocRef_promise_obj(sendDocRef_return_values);
    this.sendDocRefWithRetry_promise_obj = new sendDocRefWithRetry_promise_obj(sendDocRefWithRetry_return_values);
    this.sendDocRef = sendDocRef;
    this.sendDocRefWithRetry = sendDocRefWithRetry;
    this.message = "I exist";
    console.log("finished creating the helper");
  }
}

