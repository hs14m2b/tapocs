import { 
  parseSAMLQueryString, 
  validateSAMLAuthnRequest,
  parseSAMLRequest,
  createSAMLResponseXML,
  createSAMLErrorResponse,
  createSAMLResponse 
} from './saml_common_functions.mjs';

export const handler = async (event) => {
  console.log('SAMLSSOProcessor handling SAML authentication request');
  
  // Support both GET (HTTP-Redirect) and POST (HTTP-POST) bindings
  const method = event.requestContext.http.method;
  console.log('SAML SSO request method:', method);
  
  try {
    let samlRequestParams = {};
    
    if (method === 'GET') {
      // HTTP-Redirect binding - SAMLRequest in query parameters
      samlRequestParams = parseSAMLQueryString(event.rawQueryString || '');
      console.log('SAML SSO params (HTTP-Redirect):', samlRequestParams);
      
    } else if (method === 'POST') {
      // HTTP-POST binding - SAMLRequest in form body
      let requestBody;
      if (event.isBase64Encoded) {
        requestBody = Buffer.from(event.body, 'base64').toString('utf8');
      } else {
        requestBody = event.body || '';
      }
      
      const { URLSearchParams } = await import('url');
      const params = new URLSearchParams(requestBody);
      samlRequestParams = {
        SAMLRequest: params.get('SAMLRequest'),
        RelayState: params.get('RelayState')
      };
      console.log('SAML SSO params (HTTP-POST):', samlRequestParams);
      
    } else {
      return createSAMLResponse(405, {
        error: 'invalid_request',
        error_description: 'SSO endpoint only accepts GET or POST requests'
      });
    }
    
    // Validate required parameters
    const validationErrors = validateSAMLAuthnRequest(samlRequestParams);
    if (validationErrors.length > 0) {
      return createSAMLResponse(400, {
        error: 'invalid_request',
        error_description: validationErrors.join(', ')
      });
    }
    
    // Parse SAML Request
    const samlRequestData = parseSAMLRequest(samlRequestParams.SAMLRequest);
    if (!samlRequestData) {
      return createSAMLResponse(400, {
        error: 'invalid_request',
        error_description: 'Unable to parse SAML request'
      });
    }
    
    console.log('Parsed SAML request:', samlRequestData);
    
    // Basic validation of issuer (minimal check like OIDC)
    const hardcodedClientId = process.env.HARDCODEDCLIENTID;
    if (samlRequestData.issuer !== hardcodedClientId) {
      return createSAMLResponse(400, {
        error: 'invalid_issuer',
        error_description: 'Invalid SAML issuer'
      });
    }
    
    // Validate ACS URL (simplified validation)
    if (samlRequestData.acsUrl && !samlRequestData.acsUrl.startsWith('https://') && !samlRequestData.acsUrl.startsWith('http://localhost')) {
      return createSAMLResponse(400, {
        error: 'invalid_request',
        error_description: 'Invalid ACS URL'
      });
    }
    
    console.log('SAML request attributes - IsPassive:', samlRequestData.isPassive, 'ForceAuthn:', samlRequestData.forceAuthn);
    
    // Handle passive authentication request
    if (samlRequestData.isPassive) {
      console.log('Passive authentication requested');
      
      // In this POC, we simulate that no user is currently authenticated
      // In a real implementation, you would check session state, cookies, etc.
      const isUserAuthenticated = false; // Simulate no active session
      
      if (!isUserAuthenticated) {
        console.log('No active authentication found for passive request, returning error');
        
        const issuer = process.env.ISSUER;
        const acsUrl = samlRequestData.acsUrl || `${samlRequestData.issuer}/acs`;
        
        // Return SAML error response for passive authentication failure
        const errorResponseBase64 = createSAMLErrorResponse(
          samlRequestData.requestId || 'default-request-id',
          issuer,
          'urn:oasis:names:tc:SAML:2.0:status:NoPassive',
          'Passive authentication requested but no active session found',
          acsUrl
        );
        
        const relayState = samlRequestParams.RelayState || '';
        const redirectUrl = `${acsUrl}?SAMLResponse=${encodeURIComponent(errorResponseBase64)}${relayState ? `&RelayState=${encodeURIComponent(relayState)}` : ''}`;
        
        return {
          statusCode: 302,
          headers: {
            'Location': redirectUrl,
            'Cache-Control': 'no-store'
          },
          body: ''
        };
      }
      
      console.log('User already authenticated, proceeding with passive authentication');
    }
    
    const issuer = process.env.ISSUER;
    const subject = "subject123"; // Hardcoded like in OIDC
    
    // Generate SAML Response
    const samlResponseBase64 = await createSAMLResponseXML(
      samlRequestData.requestId || 'default-request-id',
      issuer,
      samlRequestData.acsUrl || samlRequestData.issuer,
      subject
    );
    
    // For this POC, return the SAML Response directly instead of redirecting
    // In production, you'd typically redirect to the ACS URL with the response
    const acsUrl = samlRequestData.acsUrl || `${samlRequestData.issuer}/acs`;
    const relayState = samlRequestParams.RelayState || '';
    
    // Create redirect URL with SAML Response
    const redirectUrl = `${acsUrl}?SAMLResponse=${encodeURIComponent(samlResponseBase64)}${relayState ? `&RelayState=${encodeURIComponent(relayState)}` : ''}`;
    
    console.log('SAML SSO successful, redirecting to:', acsUrl);
    
    // Return 302 redirect like OIDC does
    return {
      statusCode: 302,
      headers: {
        'Location': redirectUrl,
        'Cache-Control': 'no-store'
      },
      body: ''
    };
    
  } catch (error) {
    console.error('SAML SSO processing error:', error);
    return createSAMLResponse(500, {
      error: 'server_error',
      error_description: 'Failed to process SAML authentication request'
    });
  }
};