import { get_document_ref_object } from '../../lambdas/get_document_ref_object.mjs';
import { apiCommonFunctionObject } from '../../lambdas/api_common_function_object.mjs'; // Adjust the import path as needed
import https from 'https';

describe('getDocRef', () => {
  let id, odscode, APIENVIRONMENT, APIKEYSECRET, APIKNAMEPARAM;
  let getDocRefInstnace, getDocRef;

  beforeEach(() => {
    getDocRefInstnace = new get_document_ref_object();
    getDocRef = getDocRefInstnace.getDocRef;
    id = 'test-id';
    odscode = 'test-odscode';
    APIENVIRONMENT = 'test-environment';
    APIKEYSECRET = 'test-secret';
    APIKNAMEPARAM = 'test-param';

    spyOn(apiCommonFunctionObject, "nrlEnvironmentMapping").and.callFake((env) => 'test-nrl-environment');
    //spyOn(nrlEnvironmentMapping, 'and.returnValue').and.callFake((env) => 'test-nrl-environment');
    //spyOn(uuidwrapper, "v4").and.returnValue('test-uuid');
    spyOn(apiCommonFunctionObject, "environmentNeedsAuth").and.callFake((env) => env === 'test-environment');
    spyOn(apiCommonFunctionObject, "getSecretValue").and.callFake(async (secret) => 'KID|KEY');
    spyOn(apiCommonFunctionObject, "getParamValue").and.callFake(async (param) => 'APIKEYNAME');
    spyOn(apiCommonFunctionObject, "createSignedJwtForAuth").and.callFake((name, kid, key, url, path) => 'signedJwt');
    spyOn(apiCommonFunctionObject, "getOAuth2AccessToken").and.callFake(async (jwt, url, path) => JSON.stringify({ access_token: 'accessToken' }));
    spyOn(https, 'request').and.callFake((options, callback) => {
      const res = {
        statusCode: 200,
        on: (event, handler) => {
          if (event === 'data') {
            handler('{"resourceType":"DocumentReference"}');
          } else if (event === 'end') {
            handler();
          }
        }
      };
      callback(res);
      return {
        on: jasmine.createSpy('on'),
        write: jasmine.createSpy('write'),
        end: jasmine.createSpy('end')
      };
    });
  });

  it('should set the correct request options and return the document reference', async () => {
    apiCommonFunctionObject.environmentNeedsAuth.and.returnValue(false);

    const result = await getDocRef(id, odscode, APIENVIRONMENT, APIKEYSECRET, APIKNAMEPARAM);
    expect(result.status).toEqual(200);
    expect(result.body).toEqual('{"resourceType":"DocumentReference"}');

    const expectedOptions = {
      host: 'test-nrl-environment.api.service.nhs.uk',
      port: 443,
      method: 'GET',
      path: `/record-locator/consumer/FHIR/R4/DocumentReference/${id}`,
      rejectUnauthorized: false,
      headers: {
        'accept': 'application/fhir+json;version=1',
        'X-Request-ID': jasmine.any(String),
        'NHSD-End-User-Organisation-ODS': odscode
      }
    };

    expect(https.request).toHaveBeenCalledWith(jasmine.objectContaining(expectedOptions), jasmine.any(Function));
  });

  it('should retrieve certificates and API key name if not present or expired', async () => {
    console.log("retrieving certificates from secrets manager");
    // spy on Date now and set to max integer value
    spyOn(Date, "now").and.returnValue(Number.MAX_SAFE_INTEGER)
    apiCommonFunctionObject.environmentNeedsAuth.and.returnValue(true);
    await getDocRef(id, odscode, APIENVIRONMENT, APIKEYSECRET, APIKNAMEPARAM);

    expect(apiCommonFunctionObject.getSecretValue).toHaveBeenCalledWith(APIKEYSECRET);
    expect(apiCommonFunctionObject.getParamValue).toHaveBeenCalledWith(APIKNAMEPARAM);
    expect(apiCommonFunctionObject.createSignedJwtForAuth).toHaveBeenCalledWith('APIKEYNAME', 'KID', 'KEY', 'test-environment.api.service.nhs.uk', '/oauth2/token');
    expect(apiCommonFunctionObject.getOAuth2AccessToken).toHaveBeenCalledWith('signedJwt', 'test-environment.api.service.nhs.uk', '/oauth2/token');
  });

  it('should add Authorization header if environment needs auth', async () => {
    apiCommonFunctionObject.environmentNeedsAuth.and.returnValue(true);
    const result = await getDocRef(id, odscode, APIENVIRONMENT, APIKEYSECRET, APIKNAMEPARAM);
    expect(result.status).toEqual(200);
    expect(result.body).toEqual('{"resourceType":"DocumentReference"}');

    const expectedOptions = {
      host: 'test-nrl-environment.api.service.nhs.uk',
      port: 443,
      method: 'GET',
      path: `/record-locator/consumer/FHIR/R4/DocumentReference/${id}`,
      rejectUnauthorized: false,
      headers: {
        'accept': 'application/fhir+json;version=1',
        'X-Request-ID': jasmine.any(String),
        'NHSD-End-User-Organisation-ODS': odscode,
        'Authorization': 'Bearer accessToken'
      }
    };

    expect(https.request).toHaveBeenCalledWith(jasmine.objectContaining(expectedOptions), jasmine.any(Function));
  });

  it('should handle request errors', async () => {
    https.request.and.callFake((options, callback) => {
      const req = {
        on: (event, handler) => {
          if (event === 'error') {
            handler(new Error('request error'));
          }
        },
        write: jasmine.createSpy('write'),
        end: jasmine.createSpy('end')
      };
      return req;
    });

    try {
      await getDocRef(id, odscode, APIENVIRONMENT, APIKEYSECRET, APIKNAMEPARAM);
    } catch (error) {
      expect(error.message).toEqual('request error');
    }
  });

  it('should handle response errors', async () => {
    https.request.and.callFake((options, callback) => {
      const res = {
        statusCode: 500,
        on: (event, handler) => {
          if (event === 'data') {
            handler('{"error":"Internal Server Error"}');
          } else if (event === 'end') {
            handler();
          }
        }
      };
      callback(res);
      return {
        on: jasmine.createSpy('on'),
        write: jasmine.createSpy('write'),
        end: jasmine.createSpy('end')
      };
    });

    const result = await getDocRef(id, odscode, APIENVIRONMENT, APIKEYSECRET, APIKNAMEPARAM);
    expect(result.status).toEqual(500);
    expect(result.body).toEqual('{"error":"Internal Server Error"}');
  });
});
