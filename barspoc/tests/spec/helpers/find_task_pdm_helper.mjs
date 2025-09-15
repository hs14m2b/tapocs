var findTasks_return_value="";

function findTasks_promise(){
  this.findTasks_call_count++;
  findTasks_return_value = this.findTasks_return_values[this.findTasks_call_count];
  return new Promise(function(resolve, reject){
      resolve(findTasks_return_value);
  });
}

function findTasks_promise_obj(findTasks_return_values){
  this.findTasks_return_values = findTasks_return_values;
  this.findTasks_call_count = -1;
  this.promise = findTasks_promise;
}

function findTasks (querystringValues, resourceType, org, APIENVIRONMENT, APIKEYSECRET, APIKNAMEPARAM)
{
  return this.findTasks_promise_obj.promise();
}

export class find_task_pdm_helper{
  constructor(findTasks_return_values){
    console.log("creating the helper");
    this.findTasks_promise_obj = new findTasks_promise_obj(findTasks_return_values);
    this.findTasks = findTasks;
    this.message = "I exist";
    console.log("finished creating the helper");
  }
}

 
