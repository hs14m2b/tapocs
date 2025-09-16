var getServiceRequest_return_value="";

function getServiceRequest_promise(){
  this.getServiceRequest_call_count++;
  getServiceRequest_return_value = this.getServiceRequest_return_values[this.getServiceRequest_call_count];
  return new Promise(function(resolve, reject){
      resolve(getServiceRequest_return_value);
  });
}

function getServiceRequest_promise_obj(getServiceRequest_return_values){
  this.getServiceRequest_return_values = getServiceRequest_return_values;
  this.getServiceRequest_call_count = -1;
  this.promise = getServiceRequest_promise;
}

function getServiceRequest (querystringValues, resourceType, org, APIENVIRONMENT, APIKEYSECRET, APIKNAMEPARAM)
{
  return this.getServiceRequest_promise_obj.promise();
}

export class get_servicerequest_bars_helper{
  constructor(getServiceRequest_return_values){
    console.log("creating the helper");
    this.getServiceRequest_promise_obj = new getServiceRequest_promise_obj(getServiceRequest_return_values);
    this.getServiceRequest = getServiceRequest;
    this.message = "I exist";
    console.log("finished creating the helper");
  }
}

 
