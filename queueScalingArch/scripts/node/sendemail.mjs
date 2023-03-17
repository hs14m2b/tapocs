import { NotifyClient } from "notifications-node-client";
import { v4 as uuidv4 } from 'uuid';

const TEMPLATEID = "b844408b-e85d-470d-9d56-49bbc20f282d";
const NOTIFYAPIKEY = "commsmgrpoc-5e556db9-b71b-472a-9ba0-627bc2954844-55a0fec2-fc3e-4b8e-8027-9835190ad242";
const notifyClient = new NotifyClient("https://main-queuescaling-notifications.nhsdta.com",NOTIFYAPIKEY);
//const notifyClient = new NotifyClient(NOTIFYAPIKEY);



let personalisation = {
    "title": "Mr",
    "familyname": "Brown",
    "givenname": "Matthew",
    "nhsnumberformatted": "9999998765"
};


let notifyResult = await notifyClient
		.sendEmail(TEMPLATEID, "matthewandkaren@hotmail.com", {
			personalisation: personalisation,
			reference: uuidv4()
		});

console.log(JSON.stringify(notifyResult.data));
