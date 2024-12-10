import { handler } from '../../lambdas/DiagnosticReportLocal.mjs';
import diagnosticreport001 from '../../lambdas/data/diagnosticreport001.json' assert { type: 'json' };

describe('handler', () => {
  let event;

  beforeEach(() => {
    event = {
      pathParameters: {
        diagnosticreportid: 'test-id'
      }
    };
  });

  it('should return the diagnostic report with the correct ID', async () => {
    const result = await handler(event);
    const expectedResponse = {
      ...diagnosticreport001,
      id: 'test-id'
    };

    expect(result.statusCode).toEqual(200);
    expect(result.headers['Content-Type']).toEqual('application/fhir+json');
    expect(result.headers['X-Source']).toEqual('The local endpoint');
    expect(JSON.parse(result.body)).toEqual(expectedResponse);
  });

  it('should handle errors gracefully', async () => {
    event = null; // Simulate an error scenario

    const result = await handler(event);

    expect(result.statusCode).toEqual(500);
    expect(result.headers['Content-Type']).toEqual('application/json');
    expect(JSON.parse(result.body).result).toBeDefined();
  });
});
