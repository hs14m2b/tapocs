import { createSignedJwtForAuth, getOAuth2AccessToken } from '../api_common_functions.mjs';

import { createPrivateKey } from 'node:crypto';
import { readFileSync } from 'node:fs';

const apiClientPrivateKey = readFileSync('../../certs/mhdconvint1.key', 'utf8');
//console.log(apiClientPrivateKey);
//let secretOrPrivateKey = createPrivateKey(apiClientPrivateKey);
let blah = await createSignedJwtForAuth("kqU7ldmK4wVoDQA6c76bNsAFMzw8SmGQ", 
"mhdconvint1", apiClientPrivateKey,
"int.api.service.nhs.uk", "/oauth2/token");
console.log(blah);
let blah2 = await getOAuth2AccessToken(blah, "int.api.service.nhs.uk", "/oauth2/token");
console.log(blah2);