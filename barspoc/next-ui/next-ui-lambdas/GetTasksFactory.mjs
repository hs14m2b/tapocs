import { handler as processor } from './GetTasksProcessor.mjs';
import { getParameterCaseInsensitive } from './api_common_functions.mjs';
import { find_task_pdm } from './find_task_pdm_object.mjs';


const APIKEYSECRET = process.env['APIKEYSECRET'];
const APIENVIRONMENT = process.env['APIENVIRONMENT'];
const APIKNAMEPARAM = process.env['APIKNAMEPARAM'];
const NRLENABLED = (process.env['NRLENABLED'] != "false") ? true : false;

export const handler = async (event) => {
  console.log(JSON.stringify(event));
    try {
        let findTaskPdmObject = new find_task_pdm();
        return await processor(event, findTaskPdmObject, getParameterCaseInsensitive, APIENVIRONMENT, APIKEYSECRET, APIKNAMEPARAM, NRLENABLED)
    } catch (error) {
        console.log("caught error " + error.message);
        let response = {
            statusCode: 500,
            "headers": {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ "result": error.message })
        }
        return response;
    }
}
