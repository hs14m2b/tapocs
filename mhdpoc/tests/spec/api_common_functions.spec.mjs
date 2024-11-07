import { createSignedJwtForAuth } from '../../lambdas/api_common_functions.mjs';
import { readFileSync } from 'fs';
import { decode } from 'jsonwebtoken';

describe("API Common Functions", function() {
    process.env["TOKEN_ISSUER"] = "https://stub.signin.nhs.uk";
    process.env["SIGNALG"] = "RS512";
    process.env["EXPIRY_SECS"] = "600";
    process.env["ACCESS_TOKEN_EXPIRY_SECS"] = "6000";
	const apiClientPrivateKey = readFileSync('../tests/spec/certs/api_client_RS512.key', 'ascii');
 
    beforeEach(function() {
		console.log("do something before each test");
    });
  
	it ("can generate a signed jwt", async function(){
		let signedJwtForAuth = createSignedJwtForAuth("Gy4tfYPuNAoyIEFU1cYvZabTAmZb2nD2", "test-001", apiClientPrivateKey, "dev.api.service.nhs.uk", "/oauth2/token");
		let token_decoded = decode(signedJwtForAuth, {"complete": true});
		let id_kid = token_decoded.header.kid;
		expect(id_kid).toEqual("test-001");
	});

});
  