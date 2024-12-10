import { handler } from '../../lambdas/DiagnosticReportProxy.mjs';
import { getParameterCaseInsensitive } from '../../lambdas/api_common_functions.mjs';
import { apiCommonFunctionObject } from '../../lambdas/api_common_function_object.mjs';

describe('handler', () => {
  let event;

  beforeEach(() => {
    process.env['SECRETSMGRCERT']= "SECRETSMGRCERT";
    process.env['SECRETSMGRCERTKEY'] = "SECRETSMGRCERTKEY";

    event = {
      headers: {
        'NHSE-NRL-Pointer-URL': 'https://test.local/diagnostic-report'
      }
    };

    spyOn(apiCommonFunctionObject, "getDiagnosticReportFromLocalServer").and.callFake(async (pointerUrl, CLIENTCERTIFICATE, CLIENTCERTIFICATEKEY) => ({
      status: 200,
      body: '{"resourceType":"DiagnosticReport"}'
    }));
    spyOn(apiCommonFunctionObject, "getSecretValue").and.callFake(async (secret) => 'KID|KEY');
  });

  it('should retrieve the pointer URL from headers and return the diagnostic report', async () => {
    const result = await handler(event);
    expect(apiCommonFunctionObject.getDiagnosticReportFromLocalServer).toHaveBeenCalledWith('https://test.local/diagnostic-report', jasmine.any(String), jasmine.any(String));
    expect(result.statusCode).toEqual(200);
    expect(result.body).toEqual('{"resourceType":"DiagnosticReport"}');
  });

  it('should handle missing pointer URL in headers', async () => {
    event.headers = {};
    const result = await handler(event);
    expect(result.statusCode).toEqual(400);
    expect(result.body).toEqual('{"error":"Missing NHSE-NRL-Pointer-URL header"}');
  });

  it('should handle errors from getDiagnosticReportFromLocalServer', async () => {
    apiCommonFunctionObject.getDiagnosticReportFromLocalServer.and.callFake(async () => {
      throw new Error('request error');
    });

    const result = await handler(event);

    expect(apiCommonFunctionObject.getDiagnosticReportFromLocalServer).toHaveBeenCalledWith('https://test.local/diagnostic-report', jasmine.any(String), jasmine.any(String));
    expect(result.statusCode).toEqual(500);
    expect(result.body).toEqual('{"result":"request error"}');
  });
});
