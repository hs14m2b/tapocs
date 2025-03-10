import { getOAuth2AccessToken } from '../../lambdas/api_common_functions.mjs';
import https from 'node:https';

describe('getOAuth2AccessToken', () => {
  let signed_jwt, oauth_fqdn, oauth_auth_path;

  beforeEach(() => {
    signed_jwt = 'test-signed-jwt';
    oauth_fqdn = 'test.oauth.fqdn';
    oauth_auth_path = '/oauth2/token';
    spyOn(https, 'request').and.callFake((options, callback) => {
      const res = {
        statusCode: 200,
        on: (event, handler) => {
          if (event === 'data') {
            console.log("data event");
            handler('{"access_token":"test-access-token"}');
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

  it('should set the correct request options and return the access token', async () => {
    const result = await getOAuth2AccessToken(signed_jwt, oauth_fqdn, oauth_auth_path);
    expect(result).toEqual('{"access_token":"test-access-token"}');

    const expectedOptions = {
      host: oauth_fqdn,
      port: 443,
      method: 'POST',
      path: oauth_auth_path,
      rejectUnauthorized: false,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': jasmine.any(Number)
      }
    };

    expect(https.request).toHaveBeenCalledWith(jasmine.objectContaining(expectedOptions), jasmine.any(Function));
  });

  it('should handle request errors', async () => {
    https.request.and.callFake((options, callback) => {
      const req = {
        on: (event, handler) => {
          console.log("event is " + event);
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
      await getOAuth2AccessToken(signed_jwt, oauth_fqdn, oauth_auth_path);
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

    const result = await getOAuth2AccessToken(signed_jwt, oauth_fqdn, oauth_auth_path);
    expect(result).toEqual('{"error":"Internal Server Error"}');
  });
});
