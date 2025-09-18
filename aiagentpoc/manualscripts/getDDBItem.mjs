import { ddbCommonFunctionObject } from './ddb_common_functions.mjs';
const REGION = "eu-west-2";

let ddbCommonFunctionObjectInstance = new ddbCommonFunctionObject();

let ddbresponse = await ddbCommonFunctionObjectInstance.getItemDDB({"messageuuid": "15499de8-6901-4be9-ab79-8fb3eecfbe01"}, "barspocui-main-aiResponseTable");
console.log("ddb response is " + JSON.stringify(ddbresponse));
