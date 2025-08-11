var getDocRef_return_value="";

function getDocRef_promise(){
  console.log("running the promise function");
  this.getDocRef_call_count++;
  getDocRef_return_value = this.getDocRef_return_values[this.getDocRef_call_count];
  return new Promise(function(resolve, reject){
      resolve(getDocRef_return_value);
  });
}

class getDocRef_promise_obj{
  constructor(getDocRef_return_values){
    this.getDocRef_return_values = getDocRef_return_values;
    this.getDocRef_call_count = -1;
    this.promise = getDocRef_promise;
  }
}

function getDocRef(documentid, odscode, APIENVIRONMENT, APIKEYSECRET, APIKNAMEPARAM)
{
  console.log("got here");

  console.log(JSON.stringify(this));
  return this.getDocRef_promise_obj.promise();
}

export class get_document_ref_object{
  constructor(getDocRef_return_values){
    console.log("creating the helper");
    this.getDocRef_promise_obj = new getDocRef_promise_obj(getDocRef_return_values);
    this.getDocRef = getDocRef;
    this.message = "I exist";
  }
}

 
