var findSlots_return_value="";
var findSlotsWithRetry_return_value="";

function findSlots_promise(){
  this.findSlots_call_count++;
  findSlots_return_value = this.findSlots_return_values[this.findSlots_call_count];
  return new Promise(function(resolve, reject){
      resolve(findSlots_return_value);
  });
}

function findSlotsWithRetry_promise(){
  console.log("running the promise function");
  this.findSlotsWithRetry_call_count++;
  findSlotsWithRetry_return_value = this.findSlotsWithRetry_return_values[this.findSlotsWithRetry_call_count];
  return new Promise(function(resolve, reject){
      resolve(findSlotsWithRetry_return_value);
  });
}

function findSlots_promise_obj(findSlots_return_values){
  this.findSlots_return_values = findSlots_return_values;
  this.findSlots_call_count = -1;
  this.promise = findSlots_promise;
}

class findSlotsWithRetry_promise_obj{
  constructor(findSlotsWithRetry_return_values){
    this.findSlotsWithRetry_return_values = findSlotsWithRetry_return_values;
    this.findSlotsWithRetry_call_count = -1;
    this.promise = findSlotsWithRetry_promise;
  }
}

function findSlots (querystringValues, resourceType, org, APIENVIRONMENT, APIKEYSECRET, APIKNAMEPARAM)
{
  return this.findSlots_promise_obj.promise();
}


function findSlotsWithRetry(maxDuration, querystringValues, resourceType, org, APIENVIRONMENT, APIKEYSECRET, APIKNAMEPARAM)
{
  return this.findSlotsWithRetry_promise_obj.promise();
}

export class find_slots_bars_helper{
  constructor(findSlots_return_values, findSlotsWithRetry_return_values){
    console.log("creating the helper");
    this.findSlots_promise_obj = new findSlots_promise_obj(findSlots_return_values);
    this.findSlotsWithRetry_promise_obj = new findSlotsWithRetry_promise_obj(findSlotsWithRetry_return_values);
    this.findSlots = findSlots;
    this.findSlotsWithRetry = findSlotsWithRetry;
    this.message = "I exist";
    console.log("finished creating the helper");
  }
}

