var getAppointment_return_value="";
var getAppointmentWithRetry_return_value="";

function getAppointment_promise(){
  this.getAppointment_call_count++;
  getAppointment_return_value = this.getAppointment_return_values[this.getAppointment_call_count];
  return new Promise(function(resolve, reject){
      resolve(getAppointment_return_value);
  });
}

function getAppointmentWithRetry_promise(){
  console.log("running the promise function");
  this.getAppointmentWithRetry_call_count++;
  getAppointmentWithRetry_return_value = this.getAppointmentWithRetry_return_values[this.getAppointmentWithRetry_call_count];
  return new Promise(function(resolve, reject){
      resolve(getAppointmentWithRetry_return_value);
  });
}

function getAppointment_promise_obj(getAppointment_return_values){
  this.getAppointment_return_values = getAppointment_return_values;
  this.getAppointment_call_count = -1;
  this.promise = getAppointment_promise;
}

class getAppointmentWithRetry_promise_obj{
  constructor(getAppointmentWithRetry_return_values){
    this.getAppointmentWithRetry_return_values = getAppointmentWithRetry_return_values;
    this.getAppointmentWithRetry_call_count = -1;
    this.promise = getAppointmentWithRetry_promise;
  }
}

function getAppointment (querystringValues, resourceType, org, APIENVIRONMENT, APIKEYSECRET, APIKNAMEPARAM)
{
  return this.getAppointment_promise_obj.promise();
}


function getAppointmentWithRetry(maxDuration, querystringValues, resourceType, org, APIENVIRONMENT, APIKEYSECRET, APIKNAMEPARAM)
{
  return this.getAppointmentWithRetry_promise_obj.promise();
}

export class get_appointment_bars_helper{
  constructor(getAppointment_return_values, getAppointmentWithRetry_return_values){
    console.log("creating the helper");
    this.getAppointment_promise_obj = new getAppointment_promise_obj(getAppointment_return_values);
    this.getAppointmentWithRetry_promise_obj = new getAppointmentWithRetry_promise_obj(getAppointmentWithRetry_return_values);
    this.getAppointment = getAppointment;
    this.getAppointmentWithRetry = getAppointmentWithRetry;
    this.message = "I exist";
    console.log("finished creating the helper");
  }
}

