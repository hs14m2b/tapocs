var publishEvent_return_value="";

function publishEvent_promise(){
  this.publishEvent_call_count++;
  publishEvent_return_value = this.publishEvent_return_values[this.publishEvent_call_count];
  return new Promise(function(resolve, reject){
      resolve(publishEvent_return_value);
  });
}

function publishEvent_promise_obj(publishEvent_return_values){
  this.publishEvent_return_values = publishEvent_return_values;
  this.publishEvent_call_count = -1;
  this.promise = publishEvent_promise;
}

function publishEvent(event, snsTopicArn)
{
  return this.publishEvent_promise_obj.promise();
}

export class snsCommonFunctionHelperObject{
  constructor(publishEvent_return_values){
    console.log("creating the helper");
    this.publishEvent_promise_obj = new publishEvent_promise_obj(publishEvent_return_values);
    this.publishEvent = publishEvent;
    this.message = "I exist";
    console.log("finished creating the helper");
  }
}

 
