import { readFileSync } from 'fs';
import { decode } from 'jsonwebtoken';
import { createSignedJwtForAuth, getParameterCaseInsensitive } from '../../lambdas/api_common_functions.mjs';

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

  it('should return the value for an exact match', () => {
    const obj = { 'Key': 'value' };
    const result = getParameterCaseInsensitive(obj, 'Key');
    expect(result).toEqual('value');
  });

  it('should return the value for a case-insensitive match', () => {
    const obj = { 'Key': 'value' };
    const result = getParameterCaseInsensitive(obj, 'key');
    expect(result).toEqual('value');
  });

  it('should return undefined if the key does not exist', () => {
    const obj = { 'Key': 'value' };
    const result = getParameterCaseInsensitive(obj, 'NonExistentKey');
    expect(result).toBeUndefined();
  });

  it('should return the value for a mixed-case match', () => {
    const obj = { 'Key': 'value' };
    const result = getParameterCaseInsensitive(obj, 'kEy');
    expect(result).toEqual('value');
  });

  it('should handle an empty object', () => {
    const obj = {};
    const result = getParameterCaseInsensitive(obj, 'Key');
    expect(result).toBeUndefined();
  });

  it('should handle an object with multiple keys', () => {
    const obj = { 'Key1': 'value1', 'Key2': 'value2' };
    const result = getParameterCaseInsensitive(obj, 'key2');
    expect(result).toEqual('value2');
  });

});
