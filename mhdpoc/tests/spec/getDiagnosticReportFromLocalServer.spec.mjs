import { getDiagnosticReportFromLocalServer } from '../../lambdas/api_common_functions.mjs';
import https from 'node:https';

describe('getDiagnosticReportFromLocalServer', () => {
  let pointerUrl, CLIENTCERTIFICATE, CLIENTCERTIFICATEKEY;

  beforeEach(() => {
    pointerUrl = 'https://test.local/diagnostic-report';
    CLIENTCERTIFICATE = 'test-client-certificate';
    CLIENTCERTIFICATEKEY = 'test-client-certificate-key';
    spyOn(https, 'request').and.callFake((options, callback) => {
      const res = {
        statusCode: 200,
        on: (event, handler) => {
          if (event === 'data') {
            console.log("data event");
            handler('{"resourceType":"DiagnosticReport"}');
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

  it('should set the correct request options and return the diagnostic report', async () => {
    const result = await getDiagnosticReportFromLocalServer(pointerUrl, CLIENTCERTIFICATE, CLIENTCERTIFICATEKEY);
    expect(result.status).toEqual(200);
    expect(result.body).toEqual('{"resourceType":"DiagnosticReport"}');

    const expectedOptions = {
      host: 'test.local',
      port: 443,
      method: 'GET',
      path: '/diagnostic-report',
      rejectUnauthorized: false,
      key: CLIENTCERTIFICATEKEY,
      cert: CLIENTCERTIFICATE,
      headers: {
        'accept': 'application/fhir+json;version=1'
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
      await getDiagnosticReportFromLocalServer(pointerUrl, CLIENTCERTIFICATE, CLIENTCERTIFICATEKEY);
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

    const result = await getDiagnosticReportFromLocalServer(pointerUrl, CLIENTCERTIFICATE, CLIENTCERTIFICATEKEY);
    expect(result.status).toEqual(500);
    expect(result.body).toEqual('{"error":"Internal Server Error"}');
  });
});
