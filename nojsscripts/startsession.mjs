import {getContent, getHeaders} from './common_functions.mjs';

let sessionStartHeaders = await getHeaders("https://www.registertovote.service.gov.uk/register-to-vote/start");

let cookies = sessionStartHeaders['set-cookie'];
let applicationCookie='';
for (let cookie in cookies){
    console.log(cookies[cookie]);
    if (cookies[cookie].startsWith('application=') && !cookies[cookie].startsWith('application=;')){
        applicationCookie=cookies[cookie];
    }
}

console.log("application session is " + applicationCookie);
