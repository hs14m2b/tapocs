import { URLSearchParams } from 'url';
import {
  parseSAMLQueryString,
  parseSAMLRequest,
  createSAMLResponse
} from './saml_common_functions.mjs';

export const handler = async (event) => {
  console.log('SAMLACSProcessor handling SAML assertion consumer request');
  
  // Accept both GET and POST requests for SAML ACS
  const method = event.requestContext.http.method;
  
  try {
    let samlResponse = null;
    let relayState = null;
    
    if (method === 'POST') {
      // Parse form data from request body (HTTP-POST binding)
      let requestBody;
      if (event.isBase64Encoded) {
        requestBody = Buffer.from(event.body, 'base64').toString('utf8');
      } else {
        requestBody = event.body || '';
      }
      
      const params = new URLSearchParams(requestBody);
      samlResponse = params.get('SAMLResponse');
      relayState = params.get('RelayState');
      
    } else if (method === 'GET') {
      // Parse query parameters (HTTP-Redirect binding)
      const queryParams = parseSAMLQueryString(event.rawQueryString || '');
      samlResponse = queryParams.SAMLResponse;
      relayState = queryParams.RelayState;
    } else {
      return createSAMLResponse(405, {
        error: 'invalid_request',
        error_description: 'ACS endpoint only accepts GET or POST requests'
      });
    }
    
    console.log('SAML ACS params - method:', method, 'hasResponse:', !!samlResponse);
    
    // Validate required parameters
    if (!samlResponse) {
      return createSAMLResponse(400, {
        error: 'invalid_request',
        error_description: 'Missing SAMLResponse parameter'
      });
    }
    
    // Parse SAML Response (basic validation)
    try {
      const decodedResponse = Buffer.from(samlResponse, 'base64').toString('utf-8');
      console.log('Decoded SAML Response length:', decodedResponse.length);
      
      // Basic validation - check for success status
      const statusMatch = decodedResponse.match(/<samlp:StatusCode\s+Value="([^"]+)"/);
      const status = statusMatch ? statusMatch[1] : null;
      
      if (status !== 'urn:oasis:names:tc:SAML:2.0:status:Success') {
        return createSAMLResponse(400, {
          error: 'authentication_failed',
          error_description: 'SAML authentication was not successful'
        });
      }
      
      // Extract basic information from response
      const subjectMatch = decodedResponse.match(/<saml:NameID[^>]*>([^<]+)<\/saml:NameID>/);
      const subject = subjectMatch ? subjectMatch[1] : 'unknown';
      
      const issuerMatch = decodedResponse.match(/<saml:Issuer>([^<]+)<\/saml:Issuer>/);
      const issuer = issuerMatch ? issuerMatch[1] : 'unknown';
      
      console.log('SAML Response processed - Subject:', subject, 'Issuer:', issuer);
      
      // In a real implementation, you would:
      // 1. Validate the signature
      // 2. Check conditions (NotBefore, NotOnOrAfter)
      // 3. Validate audience restrictions
      // 4. Extract and process attributes
      // 5. Create a session for the user
      
      // For this POC, return success with basic information
      const responseData = {
        status: 'success',
        subject: subject,
        issuer: issuer,
        relayState: relayState,
        timestamp: new Date().toISOString(),
        message: 'SAML assertion processed successfully'
      };
      
      // If RelayState was provided, it typically contains the original target URL
      if (relayState) {
        responseData.targetUrl = relayState;
      }
      
      return createSAMLResponse(200, responseData, {
        'Cache-Control': 'no-store',
        'Pragma': 'no-cache'
      });
      
    } catch (decodeError) {
      console.error('Error decoding SAML response:', decodeError);
      return createSAMLResponse(400, {
        error: 'invalid_response',
        error_description: 'Unable to decode SAML response'
      });
    }
    
  } catch (error) {
    console.error('SAML ACS processing error:', error);
    return createSAMLResponse(500, {
      error: 'server_error',
      error_description: 'Failed to process SAML assertion'
    });
  }
};